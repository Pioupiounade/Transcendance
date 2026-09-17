import React, { useState } from 'react';
import { ProfileForm } from './components/ProfileForm';
import { ProfileView } from './components/ProfileView';
import type { UserProfile } from './types/profile';

function App() {
  // 1. Controla qué pantalla se ve (false = Ver perfil, true = Formulario)
  const [isEditing, setIsEditing] = useState(false);

  // 2. Guarda los datos del usuario para compartirlos entre ambas pantallas
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: 'lennox_92',
    description: 'Community volunteer and local gardener. Always open to collaborate on neighborhood initiatives!',
    visibility: 'PUBLIC',
    location: { latitude: 48.8566, longitude: 2.3522 },
    profilePicture: '',
  });

  // 3. Cuando guardas en el formulario, actualiza los datos y vuelve a la vista
  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    setIsEditing(false);
  };

  // 4. Acción para el botón de borrar cuenta
  const handleDeleteAccount = async () => {
    console.log('Account deletion requested');
    alert('Account deleted successfully');
  };

  return (
    <div>
      {isEditing ? (
        <ProfileForm
          initialData={userProfile}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <ProfileView
          profile={userProfile}
          onEdit={() => setIsEditing(true)}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}

export default App;