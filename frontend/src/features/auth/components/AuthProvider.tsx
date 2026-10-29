import { io } from 'socket.io-client';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { session } from '@/shared/api';
import {
  getMe,
  login,
  logout,
  register,
  type AuthSuccessResponse,
  type Credentials,
} from '../api/authApi';
import { AuthContext, type AuthState } from '../hooks/authContext';
import type { AuthStatus, AuthUser } from '../types';

type AuthProviderProps = { children: ReactNode };

type Snapshot = { status: AuthStatus; user: AuthUser | null };

const ANONYMOUS: Snapshot = { status: 'anonymous', user: null };

// Au chargement, l'access token (mémoire) est perdu ; s'il reste une session persistée,
// on passe par `loading` le temps de GET /auth/me (le client HTTP rafraîchit le token si besoin).
// Sans cet état intermédiaire, un utilisateur connecté verrait un flash de redirection vers /login.
export function AuthProvider({ children }: AuthProviderProps) {
  const [snapshot, setSnapshot] = useState<Snapshot>(() =>
    session.exists ? { status: 'loading', user: null } : ANONYMOUS,
  );

  useEffect(() => {
    if (!session.exists) return;
    const controller = new AbortController();
    getMe(controller.signal)
      .then((user) => setSnapshot({ status: 'authenticated', user }))
      .catch(() => {
        if (controller.signal.aborted) return;
        session.clear();
        setSnapshot(ANONYMOUS);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => session.onExpire(() => setSnapshot(ANONYMOUS)), []);

  useEffect(() => {
    if (snapshot.status !== 'authenticated') return;

    const socket = io({
      path: '/socket.io',
      auth: (cb) => cb({ token: session.accessToken }),
    });

    let accountCheck: AbortController | null = null;

    const handleConnect = () => {
      accountCheck?.abort();

      const controller = new AbortController();
      accountCheck = controller;

      void getMe(controller.signal)
        .then((user) => {
          if (controller.signal.aborted) return;

          setSnapshot((previous) => {
            if (
              previous.status !== 'authenticated' ||
              previous.user?.user_id !== user.user_id
            ) {
              return previous;
            }

            return { status: 'authenticated', user };
          });
        })
        .catch(() => {
          // Une coupure réseau ne doit pas effacer la session.
          // L'expiration de session reste gérée par le client HTTP.
        });
    };

    const handleDisconnect = () => {
      accountCheck?.abort();
    };

    const handleOnline = ({ userId }: { userId: string }) => {
      window.dispatchEvent(
        new CustomEvent('presence:change', {
          detail: { userId, isOnline: true },
        }),
      );
    };

    const handleOffline = ({ userId }: { userId: string }) => {
      window.dispatchEvent(
        new CustomEvent('presence:change', {
          detail: { userId, isOnline: false },
        }),
      );
    };

    const handleMembershipChanged = ({
      organizationId,
    }: {
      organizationId: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent('organization:membership-changed', {
          detail: { organizationId },
        }),
      );
    };

    const handleProfileUpdated = ({ userId }: { userId: string }) => {
      window.dispatchEvent(
        new CustomEvent('profile:updated', {
          detail: { userId },
        }),
      );
    };

    const handleFriendshipChanged = ({ userId }: { userId: string }) => {
      window.dispatchEvent(
        new CustomEvent('friendship:changed', {
          detail: { userId },
        }),
      );
    };

    const handleNewDirectMessage = (message: {
      message_id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      created_at: string;
      is_read: boolean;
    }) => {
      window.dispatchEvent(
        new CustomEvent('direct-message:new', {
          detail: message,
        }),
      );
    };

    const handleNewNotification = (notification: unknown) => {
      window.dispatchEvent(
        new CustomEvent('notification:new', {
          detail: notification,
        }),
      );
    };

    const unsubscribe = session.onTokensChanged(() => {
      if (!session.accessToken) return;

      socket.auth = { token: session.accessToken };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    });

    const handleOrganizationUpdated = ({
      organizationId,
    }: {
      organizationId: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent('organization:updated', {
          detail: { organizationId },
        }),
      );
    };

    const handleActionParticipantsChanged = ({
      actionId,
    }: {
      actionId: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent('action:participants-changed', {
          detail: { actionId },
        }),
      );
    };

    const handleActionCommentsChanged = ({
      actionId,
    }: {
      actionId: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent('action:comments-changed', {
          detail: { actionId },
        }),
      );
    };

    const handleActionUpdated = ({ actionId }: { actionId: string }) => {
      window.dispatchEvent(
        new CustomEvent('action:updated', {
          detail: { actionId },
        }),
      );
    };

    const handleOrganizationCommentsChanged = ({
      organizationId,
    }: {
      organizationId: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent('organization:comments-changed', {
          detail: { organizationId },
        }),
      );
    };

    const handleAccountStatusChanged = ({
      userId,
      accountStatus,
    }: {
      userId: string;
      accountStatus: 'ACTIVE' | 'SUSPENDED';
    }) => {
      accountCheck?.abort();
      setSnapshot((previous) => {
        if (!previous.user || previous.user.user_id !== userId) {
          return previous;
        }

        return {
          ...previous,
          user: {
            ...previous.user,
            account_status: accountStatus,
          },
        };
      });
    };

    const handleAccountDeleted = ({ userId }: { userId: string }) => {
      if (userId !== snapshot.user?.user_id) return;

      accountCheck?.abort();
      session.clear();
      setSnapshot(ANONYMOUS);
      socket.disconnect();
    };

    const handleUserDeleted = ({ userId }: { userId: string }) => {
      window.dispatchEvent(
        new CustomEvent('user:deleted', {
          detail: { userId },
        }),
      );
    };

    const handleAdminDirectoryChanged = ({
      resource,
    }: {
      resource: 'users' | 'organizations' | 'actions';
    }) => {
      window.dispatchEvent(
        new CustomEvent('admin:directory-changed', {
          detail: { resource },
        }),
      );
    };

    const handleAccountRoleChanged = ({
      userId,
      role,
    }: {
      userId: string;
      role: 'USER' | 'ADMIN';
    }) => {
      accountCheck?.abort();

      setSnapshot((previous) => {
        if (previous.user?.user_id !== userId) {
          return previous;
        }

        return {
          ...previous,
          user: {
            ...previous.user,
            role,
          },
        };
      });
    };

    socket.on('presence:online', handleOnline);
    socket.on('presence:offline', handleOffline);
    socket.on('organization:membership-changed', handleMembershipChanged);
    socket.on('direct-message:new', handleNewDirectMessage);
    socket.on('notification:new', handleNewNotification);
    socket.on('profile:updated', handleProfileUpdated);
    socket.on('friendship:changed', handleFriendshipChanged);
    socket.on('organization:updated', handleOrganizationUpdated);
    socket.on('action:participants-changed', handleActionParticipantsChanged);
    socket.on('action:comments-changed', handleActionCommentsChanged);
    socket.on('action:updated', handleActionUpdated);
    socket.on('organization:comments-changed', handleOrganizationCommentsChanged);
    socket.on('account:status-changed', handleAccountStatusChanged);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('account:deleted', handleAccountDeleted);
    socket.on('user:deleted', handleUserDeleted);
    socket.on(
      'admin:directory-changed',
      handleAdminDirectoryChanged,
    );
    socket.on('account:role-changed', handleAccountRoleChanged);

    return () => {
      unsubscribe();
      socket.off('presence:online', handleOnline);
      socket.off('presence:offline', handleOffline);
      socket.off('organization:membership-changed', handleMembershipChanged);
      socket.off('direct-message:new', handleNewDirectMessage);
      socket.off('notification:new', handleNewNotification);
      socket.off('profile:updated', handleProfileUpdated);
      socket.off('friendship:changed', handleFriendshipChanged);
      socket.off('organization:updated', handleOrganizationUpdated);
      socket.off('action:participants-changed', handleActionParticipantsChanged);
      socket.off('action:comments-changed', handleActionCommentsChanged);
      socket.off('action:updated', handleActionUpdated);
      socket.off('organization:comments-changed', handleOrganizationCommentsChanged);
      socket.off('account:status-changed', handleAccountStatusChanged);
      accountCheck?.abort();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('account:deleted', handleAccountDeleted);
      socket.off('user:deleted', handleUserDeleted);
      socket.off(
        'admin:directory-changed',
        handleAdminDirectoryChanged,
      );
      socket.off('account:role-changed', handleAccountRoleChanged);
      socket.disconnect();
    };
  }, [snapshot.status]);


  // Login et register renvoient la même chose : tokens + utilisateur.
 const open = useCallback((response: AuthSuccessResponse) => {
  const { success: _success, user, ...tokens } = response;
    session.set(tokens, user.user_id);
    setSnapshot({ status: 'authenticated', user });
  }, []);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      const response = await login(credentials);

      if (!response.success) {
        throw response;
      }

      open(response);
    },
    [open],
  );

  const signUp = useCallback(
    async (credentials: Credentials) => {
      const response = await register(credentials);

      if (!response.success) {
        throw response;
      }

      open(response);
    },
    [open],
  );
  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // token déjà expiré ou réseau absent : la session locale est effacée quoi qu'il arrive
    }
    session.clear();
    setSnapshot(ANONYMOUS);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ ...snapshot, signIn, signUp, signOut }),
    [snapshot, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
