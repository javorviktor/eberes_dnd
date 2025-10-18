'use client';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Instance {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  dm: {
    id: number;
    username: string;
  };
  invitations: Array<{
    id: number;
    status: string;
    player: {
      id: number;
      username: string;
    };
  }>;
  _count: {
    invitations: number;
    sessions: number;
  };
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [characterInput, setCharacterInput] = useState({
    characterName: '',
    maxHP: '',
    currentHP: '',
    tempHP: '',
    initiative: ''
  });
  const [isSubmittingCharacter, setIsSubmittingCharacter] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null;
    const role = typeof window !== 'undefined' ? sessionStorage.getItem('userRole') : null;
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
      
      // Fetch current user data
      fetchCurrentUser(token);
      
      // Check for success message from auth
      const authSuccessMessage = sessionStorage.getItem('authSuccessMessage');
      if (authSuccessMessage) {
        setSuccessMessage(authSuccessMessage);
        sessionStorage.removeItem('authSuccessMessage');
      }
      
      // Fetch instances for players
      if (role === 'Player') {
        fetchInstances(token);
      } else {
        setInstancesLoading(false);
      }
    }
    setIsLoading(false);
  }, []);

  async function fetchInstances(token: string) {
    try {
      const res = await fetch(`${API_URL}/instances`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (err) {
      console.error('Failed to fetch instances:', err);
    } finally {
      setInstancesLoading(false);
    }
  }

  async function fetchCurrentUser(token: string) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUsername(userData.username);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }

  function acceptInvitation(instanceId: number) {
    setSelectedInstanceId(instanceId);
    setIsCharacterModalOpen(true);
  }

  async function handleSubmitCharacter() {
    if (!selectedInstanceId) return;
    
    setIsSubmittingCharacter(true);
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      // First accept the invitation
      const acceptResponse = await fetch(`${API_URL}/instances/${selectedInstanceId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!acceptResponse.ok) {
        throw new Error('Failed to accept invitation');
      }

      // Then create the character
      const characterResponse = await fetch(`${API_URL}/instances/${selectedInstanceId}/select-character`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterName: characterInput.characterName,
          maxHP: parseInt(characterInput.maxHP) || 0,
          currentHP: parseInt(characterInput.currentHP) || 0,
          tempHP: parseInt(characterInput.tempHP) || 0,
          initiative: parseInt(characterInput.initiative) || 0
        }),
      });

      if (characterResponse.ok) {
        await fetchInstances(token);
        setSuccessMessage('Character created and invitation accepted! You can now join the instance.');
        setIsCharacterModalOpen(false);
        setCharacterInput({ characterName: '', maxHP: '', currentHP: '', tempHP: '', initiative: '' });
      } else {
        throw new Error('Failed to create character');
      }
    } catch (err) {
      console.error('Failed to accept invitation and create character:', err);
    } finally {
      setIsSubmittingCharacter(false);
    }
  }

  function closeCharacterModal() {
    setIsCharacterModalOpen(false);
    setSelectedInstanceId(null);
    setCharacterInput({ characterName: '', maxHP: '', currentHP: '', tempHP: '', initiative: '' });
  }

  async function declineInvitation(instanceId: number) {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/instances/${instanceId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setInstances(prev => prev.filter(instance => instance.id !== instanceId));
        setSuccessMessage('Invitation declined.');
      }
    } catch (err) {
      console.error('Failed to decline invitation:', err);
    }
  }

  async function joinInstance(instanceId: number) {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/instances/${instanceId}/enter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        window.location.href = `/instance/${instanceId}`;
      }
    } catch (err) {
      console.error('Failed to join instance:', err);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authSuccessMessage');
    window.location.replace('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
        <div className="min-h-screen bg-black/60 flex items-center justify-center">
          <div className="text-[#e2e2bf]">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-blue-800 mb-2">Access Required</h1>
          <p className="text-blue-700 mb-4">Please sign up or log in to access your dashboard.</p>
          <a href="/auth" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Sign Up / Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
      <div className="min-h-screen bg-black/60">
        <div className="max-w-2xl mx-auto text-[#e2e2bf] p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">
              Enter Battle{username ? ` as ${username}` : ''}
            </h1>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h5a1.5 1.5 0 010 3h-5A1.5 1.5 0 013 4.5zM11 10a1 1 0 011-1h3.586l-1.293-1.293a1 1 0 111.414-1.414l3.001 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L15.586 11H12a1 1 0 01-1-1zM9.5 14a1.5 1.5 0 010 3h-5a1.5 1.5 0 010-3h5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center gap-3 text-green-800 mb-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-semibold">Success!</span>
              </div>
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          {userRole === 'Player' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">Instance Invitations</h2>
              
              {instancesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="opacity-80 mt-2">Loading invitations...</p>
                </div>
              ) : instances.length === 0 ? (
                <div className="bg-white/10 border border-white/20 rounded-lg p-6 text-center">
                  <p>No instance invitations yet.</p>
                  <p className="text-sm mt-1 opacity-80">Dungeon Masters will send you invitations to join their game instances.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {instances.map((instance) => {
                    const invitation = instance.invitations[0];
                    const isPending = invitation?.status === 'pending';
                    const isAccepted = invitation?.status === 'accepted';
                    
                    return (
                      <div key={instance.id} className="bg-white/10 border border-white/20 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold">{instance.name}</h3>
                            <p className="text-sm opacity-80">DM: {instance.dm.username}</p>
                            {instance.description && (
                              <p className="text-sm opacity-80 mt-1">{instance.description}</p>
                            )}
                          </div>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-white/10">
                            {instance.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm opacity-80">
                            Players: {instance._count.invitations} invited, {instance._count.sessions} online
                          </div>
                          
                          <div className="flex space-x-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => acceptInvitation(instance.id)}
                                  className="px-3 py-1 bg-green-700 text-white text-sm rounded hover:bg-green-800 transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => declineInvitation(instance.id)}
                                  className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-800 transition-colors"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            
                            {isAccepted && (
                              <button
                                onClick={() => joinInstance(instance.id)}
                                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
                              >
                                Join Instance
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {userRole === 'Dungeon Master' && (
            <a 
              href="/dm-console" 
              className="block w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center text-lg font-medium"
            >
              DM Console
            </a>
          )}

          {/* Character Creation Modal */}
          {isCharacterModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Create Character for Instance</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Character Name</label>
                    <input
                      type="text"
                      value={characterInput.characterName}
                      onChange={(e) => setCharacterInput({...characterInput, characterName: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter character name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max HP</label>
                    <input
                      type="number"
                      value={characterInput.maxHP}
                      onChange={(e) => setCharacterInput({...characterInput, maxHP: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter max HP"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current HP</label>
                    <input
                      type="number"
                      value={characterInput.currentHP}
                      onChange={(e) => setCharacterInput({...characterInput, currentHP: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current HP"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp HP</label>
                    <input
                      type="number"
                      value={characterInput.tempHP}
                      onChange={(e) => setCharacterInput({...characterInput, tempHP: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter temp HP (optional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initiative</label>
                    <input
                      type="number"
                      value={characterInput.initiative}
                      onChange={(e) => setCharacterInput({...characterInput, initiative: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter initiative"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeCharacterModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitCharacter}
                    disabled={isSubmittingCharacter || !characterInput.characterName || !characterInput.maxHP || !characterInput.currentHP}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingCharacter ? 'Creating...' : 'Create Character'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
