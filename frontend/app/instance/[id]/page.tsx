'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface InstanceCharacter {
  id: number;
  characterName: string;
  maxHP: number;
  currentHP: number;
  initiative: number;
  user: {
    id: number;
    username: string;
  };
}

interface InstanceDetail {
  id: number;
  name: string;
  description?: string;
  status: string;
  instanceCharacters: InstanceCharacter[];
}

interface User {
  id: number;
  username: string;
  role: string;
}

export default function InstanceLobbyPage() {
  const params = useParams() as { id?: string };
  const instanceId = params?.id;
  const [instance, setInstance] = useState<InstanceDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHPModalOpen, setIsHPModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<InstanceCharacter | null>(null);
  const [selectedHP, setSelectedHP] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [characterConditions, setCharacterConditions] = useState<{[characterId: number]: string[]}>({});

  useEffect(() => {
    console.log('Instance page loaded, current user:', currentUser);
    console.log('Instance ID from params:', instanceId);
  }, [currentUser, instanceId]);

  useEffect(() => {
    if (!instanceId) return;

    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }

        // Fetch current user info - always fresh
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!userResponse.ok) {
          setError('Authentication failed');
          return;
        }

        const userData = await userResponse.json();
        setCurrentUser(userData);

        // Fetch instance data
        const instanceResponse = await fetch(`${API_URL}/instances/${instanceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

                if (instanceResponse.ok) {
                  const instanceData = await instanceResponse.json();
                  setInstance(instanceData);
                  
                  // Load conditions from database
                  const conditionsMap: {[characterId: number]: string[]} = {};
                  instanceData.instanceCharacters.forEach((char: any) => {
                    if (char.conditions) {
                      try {
                        conditionsMap[char.id] = JSON.parse(char.conditions);
                      } catch (e) {
                        conditionsMap[char.id] = [];
                      }
                    } else {
                      conditionsMap[char.id] = [];
                    }
                  });
                  setCharacterConditions(conditionsMap);
                } else {
                  setError('Failed to fetch instance');
                }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [instanceId]);

  // Auto-refresh every 1 second
  useEffect(() => {
    if (!autoRefresh || !instanceId) return;

    const interval = setInterval(async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        if (!token) return;

        const instanceResponse = await fetch(`${API_URL}/instances/${instanceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

                if (instanceResponse.ok) {
                  const instanceData = await instanceResponse.json();
                  setInstance(instanceData);
                  
                  // Load conditions from database
                  const conditionsMap: {[characterId: number]: string[]} = {};
                  instanceData.instanceCharacters.forEach((char: any) => {
                    if (char.conditions) {
                      try {
                        conditionsMap[char.id] = JSON.parse(char.conditions);
                      } catch (e) {
                        conditionsMap[char.id] = [];
                      }
                    } else {
                      conditionsMap[char.id] = [];
                    }
                  });
                  setCharacterConditions(conditionsMap);
                }
      } catch (err) {
        // Silent fail for auto-refresh
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, instanceId]);

  const openHPModal = (character: InstanceCharacter) => {
    // Only allow users to change their own character's HP
    if (currentUser && character.user.id === currentUser.id) {
      setSelectedCharacter(character);
      setSelectedHP(character.currentHP);
      setIsHPModalOpen(true);
    }
  };

  const closeHPModal = () => {
    setIsHPModalOpen(false);
    setSelectedCharacter(null);
    setSelectedHP(0);
  };

  const updateHP = async () => {
    if (!selectedCharacter || !instanceId) return;

    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/instances/${instanceId}/update-hp`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          newHP: selectedHP
        }),
      });

      if (response.ok) {
        // Update the local state
        if (instance) {
          const updatedCharacters = instance.instanceCharacters.map(char => 
            char.id === selectedCharacter.id 
              ? { ...char, currentHP: selectedHP }
              : char
          );
          setInstance({ ...instance, instanceCharacters: updatedCharacters });
        }
        closeHPModal();
      } else {
        console.error('Failed to update HP');
      }
    } catch (error) {
      console.error('Error updating HP:', error);
    }
  };

  const openConditionsModal = () => {
    console.log('Opening conditions modal');
    console.log('Current user:', currentUser);
    console.log('Instance characters:', instance?.instanceCharacters);
    setIsConditionsModalOpen(true);
    // Initialize with current user's character conditions
    const userCharacter = instance?.instanceCharacters.find(char => 
      currentUser && char.user.id === currentUser.id
    );
    console.log('User character found:', userCharacter);
    if (userCharacter) {
      setSelectedConditions(characterConditions[userCharacter.id] || []);
    }
  };

  const closeConditionsModal = () => {
    setIsConditionsModalOpen(false);
    setSelectedConditions([]);
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const applyConditions = async () => {
    const userCharacter = instance?.instanceCharacters.find(char => 
      currentUser && char.user.id === currentUser.id
    );
    if (userCharacter && instanceId) {
      try {
        const token = sessionStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/instances/${instanceId}/update-conditions`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId: userCharacter.id,
            conditions: selectedConditions
          }),
        });

        if (response.ok) {
          // Update local state
          setCharacterConditions(prev => ({
            ...prev,
            [userCharacter.id]: selectedConditions
          }));
          closeConditionsModal();
        } else {
          console.error('Failed to update conditions');
        }
      } catch (error) {
        console.error('Error updating conditions:', error);
      }
    }
  };

  const getConditionName = (filename: string) => {
    return filename.replace('.png', '').replace(/([A-Z])/g, ' $1').trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
        <div className="min-h-screen bg-black/60 flex items-center justify-center">
          <div className="text-[#e2e2bf]">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
        <div className="min-h-screen bg-black/60 flex items-center justify-center">
          <div className="text-[#e2e2bf]">{error || 'Instance not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}>
      <div className="min-h-screen bg-black/60">
        <div className="max-w-5xl mx-auto px-4 py-6 text-[#e2e2bf]">
          <div className="flex items-center justify-between mb-6">
            <a href="/home" className="text-[#e2e2bf] hover:text-white">Back</a>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)} 
                className={`text-sm px-2 py-1 rounded ${
                  autoRefresh 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-600 text-[#e2e2bf] hover:text-white'
                }`}
              >
                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="text-[#e2e2bf] hover:text-white text-sm"
              >
                Refresh
              </button>
              <span className="text-[#e2e2bf] text-sm">
                {currentUser?.role === 'Dungeon Master' ? 'DM POV' : `${currentUser?.username || 'Player'} POV`}
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs opacity-60 ml-2">
                    (ID: {currentUser?.id})
                  </span>
                )}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            {instance.description && (
              <p className="text-[#e2e2bf] opacity-80">{instance.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instance.instanceCharacters
              .sort((a, b) => b.initiative - a.initiative) // Sort by initiative descending
              .map((character) => {
              const hpPercentage = (character.currentHP / character.maxHP) * 100;
              const isCurrentUser = currentUser && character.user.id === currentUser.id;
              
              return (
                <div key={character.id} className="relative bg-white/10 border border-white/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">
                      {character.characterName} ({isCurrentUser ? 'me' : character.user.username})
                    </h3>
                    <span className="text-sm opacity-80">Initiative: {character.initiative}</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>HP</span>
                      <span>{character.currentHP}/{character.maxHP}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          hpPercentage > 50 ? 'bg-green-500' : 
                          hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Conditions Display */}
                  {characterConditions[character.id] && characterConditions[character.id].length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {characterConditions[character.id].map((condition, index) => (
                        <div key={index} className="flex items-center">
                          <img 
                            src={`/images/conditions/${condition}`}
                            alt={getConditionName(condition)}
                            className="w-6 h-6 object-contain"
                            title={getConditionName(condition)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* DOWN Overlay for 0 HP */}
                  {character.currentHP === 0 && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                      <span className="text-red-500 font-bold text-2xl">DOWN</span>
                    </div>
                  )}
                  
                </div>
              );
            })}
          </div>

          {/* Player-only buttons */}
          {currentUser?.role === 'Player' && (
            <div className="mt-8 flex justify-center space-x-4">
              <button 
                onClick={() => {
                  // Find the current user's character
                  const userCharacter = instance?.instanceCharacters.find(char => 
                    currentUser && char.user.id === currentUser.id
                  );
                  if (userCharacter) {
                    openHPModal(userCharacter);
                  }
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                HP Change
              </button>
              <button 
                onClick={() => {
                  console.log('Conditions button clicked');
                  openConditionsModal();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Conditions
              </button>
            </div>
          )}

          {/* HP Change Modal */}
          {isHPModalOpen && selectedCharacter && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">HP Change</h3>
                  <p className="text-slate-300">Current HP: {selectedCharacter.currentHP}</p>
                </div>
                
                {/* Vertical Number Line */}
                <div className="flex flex-col items-center space-y-1 mb-6 max-h-64 overflow-y-auto">
                  {/* Numbers above current HP */}
                  {Array.from({ length: 10 }, (_, i) => selectedCharacter.currentHP + 10 - i)
                    .filter(hp => hp > selectedCharacter.currentHP)
                    .map(hp => (
                      <button
                        key={hp}
                        onClick={() => setSelectedHP(hp)}
                        className={`w-12 h-8 rounded text-sm font-medium transition-colors ${
                          selectedHP === hp 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {hp}
                      </button>
                    ))}
                  
                  {/* Current HP (centered) */}
                  <div className="bg-green-600 text-white w-12 h-8 rounded text-sm font-medium flex items-center justify-center border-2 border-yellow-400">
                    {selectedCharacter.currentHP}
                  </div>
                  
                  {/* Numbers below current HP */}
                  {Array.from({ length: 10 }, (_, i) => selectedCharacter.currentHP - i - 1)
                    .filter(hp => hp >= 0)
                    .map(hp => (
                      <button
                        key={hp}
                        onClick={() => setSelectedHP(hp)}
                        className={`w-12 h-8 rounded text-sm font-medium transition-colors ${
                          selectedHP === hp 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {hp}
                      </button>
                    ))}
                  
                  {/* Max HP marker */}
                  <div className="text-xs text-slate-400 mt-2 border-t border-slate-600 pt-2">
                    Max HP: {selectedCharacter.maxHP}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={closeHPModal}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateHP}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {selectedHP > selectedCharacter.maxHP 
                      ? `Temp HP +${selectedHP - selectedCharacter.currentHP}`
                      : selectedHP > selectedCharacter.currentHP 
                        ? `Heal +${selectedHP - selectedCharacter.currentHP}`
                        : `Suffer -${selectedCharacter.currentHP - selectedHP}`
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conditions Modal */}
          {isConditionsModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Select Conditions</h3>
                  <p className="text-slate-300">Choose conditions to apply to your character</p>
                </div>
                
                {/* Conditions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  {[
                    'concentration.png',
                    'stunned.png'
                  ].map((condition) => (
                    <button
                      key={condition}
                      onClick={() => toggleCondition(condition)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedConditions.includes(condition)
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <img 
                        src={`/images/conditions/${condition}`}
                        alt={getConditionName(condition)}
                        className="w-12 h-12 object-contain mx-auto mb-2"
                      />
                      <p className="text-xs text-center text-white">
                        {getConditionName(condition)}
                      </p>
                    </button>
                  ))}
                </div>
                
                {/* Selected Conditions */}
                {selectedConditions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-white font-semibold mb-2">Selected Conditions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedConditions.map((condition, index) => (
                        <div key={index} className="flex items-center bg-blue-600 rounded-lg px-3 py-1">
                          <img 
                            src={`/images/conditions/${condition}`}
                            alt={getConditionName(condition)}
                            className="w-4 h-4 object-contain mr-2"
                          />
                          <span className="text-white text-sm">{getConditionName(condition)}</span>
                          <button
                            onClick={() => toggleCondition(condition)}
                            className="ml-2 text-white hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={closeConditionsModal}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyConditions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Conditions
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
