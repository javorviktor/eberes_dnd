'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Instance {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  invitations: Array<{
    id: number;
    status: string;
    player: {
      id: number;
      username: string;
      role: string;
    };
  }>;
  sessions: Array<{
    id: number;
    joinedAt: string;
    lastSeen: string;
    user: {
      id: number;
      username: string;
    };
  }>;
  instanceCharacters: Array<{
    id: number;
    userId: number;
    characterName: string;
    maxHP: number;
    currentHP: number;
    initiative: number;
    user: {
      id: number;
      username: string;
    };
  }>;
  _count: {
    invitations: number;
    sessions: number;
  };
}

export default function DMConsolePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchInstances();
    
    // Check for success message from auth
    const authSuccessMessage = sessionStorage.getItem('authSuccessMessage');
    if (authSuccessMessage) {
      setSuccessMessage(authSuccessMessage);
      // Clear the message after showing it
      sessionStorage.removeItem('authSuccessMessage');
    }
  }, []);

  async function fetchUsers() {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const res = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError('Access denied. Dungeon Master role required.');
        } else if (res.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError('Failed to fetch users');
        }
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchInstances() {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const res = await fetch(`${API_URL}/instances`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError('Access denied. Dungeon Master role required.');
        } else if (res.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError('Failed to fetch instances');
        }
        return;
      }

      const data = await res.json();
      setInstances(data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setInstancesLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authSuccessMessage');
    window.location.replace('/auth');
  }

  function openInstanceModal() {
    setIsInstanceModalOpen(true);
    setInstanceName('');
    setSelectedPlayers([]);
  }

  function closeInstanceModal() {
    setIsInstanceModalOpen(false);
    setInstanceName('');
    setSelectedPlayers([]);
  }

  const getUserStatus = (instance: Instance, userId: number) => {
    const invitations = instance.invitations ?? [];
    const sessions = instance.sessions ?? [];
    const chars = (instance as any).instanceCharacters ?? [];

    const invitation = invitations.find(inv => inv.player && inv.player.id === userId);
    const session = sessions.find(sess => sess.user && sess.user.id === userId);
    const character = chars.find((char: any) => char && char.userId === userId);

    if (!invitation) return 'Not Invited';
    if (invitation.status === 'pending') return 'Not Accepted';
    if (invitation.status === 'declined') return 'Declined';
    if (invitation.status === 'accepted' && !character) return 'Accepted';
    if (character && !session) return 'Character Created';
    if (session) return 'Joined';
    return 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Invited': return 'text-gray-500';
      case 'Not Accepted': return 'text-yellow-600';
      case 'Declined': return 'text-red-600';
      case 'Accepted': return 'text-blue-600';
      case 'Character Created': return 'text-green-600';
      case 'Joined': return 'text-green-800 font-semibold';
      default: return 'text-gray-500';
    }
  };

  function handlePlayerToggle(playerId: number) {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  }

  function handleSelectAllPlayers() {
    const playerIds = users
      .filter(user => user.role === 'Player')
      .map(user => user.id);
    setSelectedPlayers(playerIds);
  }

  function handleDeselectAllPlayers() {
    setSelectedPlayers([]);
  }

  async function handleCreateInstance() {
    if (!instanceName.trim()) {
      return;
    }
    
    setIsCreatingInstance(true);
    
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`${API_URL}/instances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: instanceName,
          invitedPlayers: selectedPlayers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create instance');
        return;
      }

      const newInstance = await response.json();
      setInstances(prev => [newInstance, ...prev]);
      setSuccessMessage(`Instance "${instanceName}" created successfully!`);
      closeInstanceModal();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsCreatingInstance(false);
    }
  }

  async function deleteInstance(instanceId: number) {
    if (!confirm('Are you sure you want to delete this instance? This action cannot be undone.')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`${API_URL}/instances/${instanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete instance');
        return;
      }

      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
      setSuccessMessage('Instance deleted successfully!');
    } catch (err) {
      setError('Network error. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
        <div className="min-h-screen bg-black/60">
          <div className="max-w-6xl mx-auto p-6 text-[#e2e2bf]">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e2e2bf]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
        <div className="min-h-screen bg-black/60">
          <div className="max-w-6xl mx-auto p-6 text-[#e2e2bf]">
            <div className="px-4 py-3 rounded bg-red-900/40 border border-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
      <div className="min-h-screen bg-black/60">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 text-[#e2e2bf]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">DM Console</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={openInstanceModal}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                Create Instance
              </button>
              <button onClick={handleLogout} aria-label="Logout" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h5a1.5 1.5 0 010 3h-5A1.5 1.5 0 013 4.5zM11 10a1 1 0 011-1h3.586l-1.293-1.293a1 1 0 111.414-1.414l3.001 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L15.586 11H12a1 1 0 01-1-1zM9.5 14a1.5 1.5 0 010 3h-5a1.5 1.5 0 010-3h5z" clipRule="evenodd"/></svg>
              </button>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-lg mt-6">
            <div className="px-4 sm:px-6 py-4 border-b border-white/20">
              <h2 className="text-lg sm:text-xl font-semibold text-[#e2e2bf]">My Instances</h2>
              <p className="text-sm sm:text-base text-[#e2e2bf] opacity-80">Total instances: {instances.length}</p>
            </div>

            {instancesLoading ? (
              <div className="p-4 sm:p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e2e2bf] mx-auto"></div>
                <p className="text-[#e2e2bf] opacity-80 mt-2">Loading instances...</p>
              </div>
            ) : instances.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 text-center text-[#e2e2bf] opacity-80">
                No instances created yet. Create your first instance to get started!
              </div>
            ) : (
              <div className="space-y-6 p-4">
                {instances.map((instance) => (
                  <div key={instance.id} className="bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                    
                    <div className="px-4 py-3 border-b border-white/20">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h3 className="text-lg font-medium text-[#e2e2bf]">{instance.name}</h3>
                          {instance.description && (
                            <p className="text-sm text-[#e2e2bf] opacity-80">{instance.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-white/10 text-[#e2e2bf]">
                            {instance.status}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.location.href = `/instance/${instance.id}`}
                              className="px-3 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
                            >
                              Enter Lobby
                            </button>
                            <button
                              onClick={() => deleteInstance(instance.id)}
                              className="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-[#e2e2bf] mb-3">Player Status:</h4>
                      <div className="space-y-2">
                        {users.filter(user => user.role === 'Player').map((user) => {
                          const status = getUserStatus(instance, user.id);
                          return (
                            <div key={user.id} className="flex justify-between items-center py-2 px-3 bg-white/10 rounded">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-[#e2e2bf]">{user.username}</span>
                              </div>
                              <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                                {status}
                              </span>
                            </div>
                          );
                        })}
                        {users.filter(user => user.role === 'Player').length === 0 && (
                          <p className="text-sm text-[#e2e2bf] opacity-80 text-center py-4">No players registered yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isInstanceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 border border-white/20 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/20">
              <h2 className="text-lg sm:text-xl font-semibold text-[#e2e2bf]">Create New Instance</h2>
              <button 
                onClick={closeInstanceModal}
                className="text-[#e2e2bf] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] text-[#e2e2bf]">
              
              <div className="mb-6">
                <label htmlFor="instanceName" className="block text-sm font-medium text-[#e2e2bf] mb-2">
                  Instance Name
                </label>
                <input
                  id="instanceName"
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="Enter instance name..."
                  className="w-full px-3 py-2 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-700 text-[#e2e2bf] placeholder-slate-400"
                  maxLength={50}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {instanceName.length}/50 characters
                </p>
              </div>

              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-[#e2e2bf]">
                    Invite Players ({selectedPlayers.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllPlayers}
                      className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllPlayers}
                      className="text-xs px-2 py-1 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                
                <div className="border border-white/20 rounded-md max-h-64 overflow-y-auto bg-slate-700">
                  {users.filter(user => user.role === 'Player').length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No players registered yet
                    </div>
                  ) : (
                    <div className="divide-y divide-white/20">
                      {users
                        .filter(user => user.role === 'Player')
                        .map((player) => (
                          <div key={player.id} className="p-3 hover:bg-slate-600 transition-colors">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPlayers.includes(player.id)}
                                onChange={() => handlePlayerToggle(player.id)}
                                className="w-4 h-4 text-blue-600 border-white/20 rounded focus:ring-blue-500 bg-slate-700"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-[#e2e2bf]">
                                  {player.username}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Player
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/20">
                <button
                  onClick={closeInstanceModal}
                  className="px-4 py-2 text-[#e2e2bf] border border-white/20 rounded-md hover:bg-slate-600 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInstance}
                  disabled={!instanceName.trim() || isCreatingInstance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  {isCreatingInstance ? 'Creating...' : 'Create Instance'}
                </button>
              </div>
            </div>
          </div>
        </div>
          )}
        </div>
      </div>
    </div>
  );
}
