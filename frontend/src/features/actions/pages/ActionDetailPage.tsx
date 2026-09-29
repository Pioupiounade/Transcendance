import React from 'react';
import { useParams } from 'react-router';
import { useActionDetail } from '../api/actionDetailMock';
import { ActionDetailsView } from '../components/ActionDetailsView';

/**
 * Page component that displays the details of a single action.
 *
 * It reads the action ID from the URL, fetches the data via the
 * `useActionDetail` hook, and renders the appropriate UI based on the
 * loading / error / success state.
 */
export const ActionDetailPage: React.FC = () => {
  // Extract the `id` param from the route. Fallback to a placeholder ID
  // if the param is missing (useful for development / mock data).
  const { id } = useParams<{ id: string }>();
  const actionId = id ?? 'action-123';

  // Fetch the action data.
  const { action, isLoading, error } = useActionDetail(actionId);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--s4)' }}>
        Loading action details...
      </div>
    );
  }

  // Error or not‑found state
  if (error || !action) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--s4)' }}>
        <h2>Action not found</h2>
        <p>
          We could not retrieve the requested action. Please check the URL or
          try again later.
        </p>
      </div>
    );
  }

  // Success – render the detailed view
  return <ActionDetailsView action={action} />;
};
