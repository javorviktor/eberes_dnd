'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { API_URL } from '../../../lib/api';

interface InstanceCharacter {
  id: number;
  characterName: string;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  initiative: number;
  lastChangeType?: string;
  lastChangeAmount?: number;
  lastChangeTimestamp?: string;
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
  const [sufferAmount, setSufferAmount] = useState<string>('');
  const [healAmount, setHealAmount] = useState<string>('');
  const [tempHP, setTempHP] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [characterConditions, setCharacterConditions] = useState<{[characterId: number]: string[]}>({});
  const [isConditionViewModalOpen, setIsConditionViewModalOpen] = useState(false);
  const [viewedCondition, setViewedCondition] = useState<string | null>(null);
  const [isCombatLogModalOpen, setIsCombatLogModalOpen] = useState(false);
  const [combatLog, setCombatLog] = useState<Array<{
    id: number;
    createdAt: string;
    characterName: string;
    action: string;
    details: string;
  }>>([]);
  const [isSpellbookModalOpen, setIsSpellbookModalOpen] = useState(false);
  const [spellSearchTerm, setSpellSearchTerm] = useState('');
  const [spells, setSpells] = useState<any[]>([]);
  const [currentSection, setCurrentSection] = useState<'live' | 'tools'>('live');
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    console.log('Instance page loaded, current user:', currentUser);
    console.log('Instance ID from params:', instanceId);
  }, [currentUser, instanceId]);

  // Add wheel event listener with proper options
  useEffect(() => {
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      
      // Only trigger if there's significant scroll movement and not already scrolling
      if (Math.abs(e.deltaY) > 10 && !isScrolling) {
        if (e.deltaY > 0 && currentSection === 'live') {
          // Scrolling down - go to tools
          scrollToSection('tools');
        } else if (e.deltaY < 0 && currentSection === 'tools') {
          // Scrolling up - go to live
          scrollToSection('live');
        }
      }
    };

    // Add event listener with passive: false to allow preventDefault
    document.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheelEvent);
    };
  }, [currentSection, isScrolling]);

  useEffect(() => {
    console.log('Current user role:', currentUser?.role);
  }, [currentUser]);

  // Auto-refresh combat log when modal is open
  useEffect(() => {
    if (!isCombatLogModalOpen) return;

    // Load combat log when modal opens
    fetchCombatLog();

    const interval = setInterval(() => {
      fetchCombatLog();
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [isCombatLogModalOpen]);

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
      setSufferAmount('');
      setHealAmount('');
      setTempHP('');
      setIsHPModalOpen(true);
    }
  };

  const closeHPModal = () => {
    setIsHPModalOpen(false);
    setSelectedCharacter(null);
    setSelectedHP(0);
    setSufferAmount('');
    setHealAmount('');
    setTempHP('');
  };

  const updateHP = async () => {
    if (!selectedCharacter || !instanceId) return;

    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      // Parse input values, defaulting to 0 if empty or invalid
      const sufferValue = sufferAmount === '' ? 0 : parseInt(sufferAmount) || 0;
      const healValue = healAmount === '' ? 0 : parseInt(healAmount) || 0;
      const tempValue = tempHP === '' ? 0 : parseInt(tempHP) || 0;
      
      // Calculate new HP based on inputs
      let newHP = selectedCharacter.currentHP;
      let newTempHP = selectedCharacter.tempHP || 0;
      
      // Apply damage (suffer) - first reduce temp HP, then real HP
      if (sufferValue > 0) {
        let remainingDamage = sufferValue;
        
        // First reduce temp HP
        if (newTempHP > 0) {
          const tempHPReduction = Math.min(newTempHP, remainingDamage);
          newTempHP -= tempHPReduction;
          remainingDamage -= tempHPReduction;
        }
        
        // Then reduce real HP
        if (remainingDamage > 0) {
          newHP = Math.max(0, newHP - remainingDamage);
        }
      }
      
      // Apply healing - can't exceed max HP
      if (healValue > 0) {
        newHP = Math.min(selectedCharacter.maxHP, newHP + healValue);
      }
      
      // Apply temp HP - can exceed max HP
      if (tempValue > 0) {
        newTempHP = tempValue; // Temp HP replaces existing temp HP
      }

      // Calculate last change data
      const changes = [];
      
      if (sufferValue > 0) {
        changes.push({ type: 'damage', amount: sufferValue });
      }
      if (healValue > 0) {
        changes.push({ type: 'healing', amount: healValue });
      }
      if (tempValue > 0) {
        changes.push({ type: 'tempHP', amount: tempValue });
      }
      
      // Determine the primary change type and amount
      let primaryType: 'damage' | 'healing' | 'tempHP' = 'damage';
      let totalAmount: number = 0;
      
      if (changes.length > 0) {
        const totalDamage = changes.filter(c => c.type === 'damage').reduce((sum, c) => sum + c.amount, 0);
        const totalHealing = changes.filter(c => c.type === 'healing').reduce((sum, c) => sum + c.amount, 0);
        const totalTempHP = changes.filter(c => c.type === 'tempHP').reduce((sum, c) => sum + c.amount, 0);
        
        if (totalDamage > 0) {
          primaryType = 'damage';
          totalAmount = totalDamage;
        } else if (totalHealing > 0) {
          primaryType = 'healing';
          totalAmount = totalHealing;
        } else {
          primaryType = 'tempHP';
          totalAmount = totalTempHP;
        }
      }

      const response = await fetch(`${API_URL}/instances/${instanceId}/update-hp`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          newHP: newHP,
          newTempHP: newTempHP,
          lastChangeType: primaryType,
          lastChangeAmount: totalAmount
        }),
      });

      if (response.ok) {
        // Update the local state
        if (instance) {
          const updatedCharacters = instance.instanceCharacters.map(char => 
            char.id === selectedCharacter.id 
              ? { ...char, currentHP: newHP, tempHP: newTempHP }
              : char
          );
          setInstance({ ...instance, instanceCharacters: updatedCharacters });
          
          // Add to combat log for each action
          if (sufferValue > 0) {
            addToCombatLog(selectedCharacter.characterName, 'Suffered', `${sufferValue} HP`);
          }
          if (healValue > 0) {
            addToCombatLog(selectedCharacter.characterName, 'Healed', `${healValue} HP`);
          }
          if (tempValue > 0) {
            addToCombatLog(selectedCharacter.characterName, 'Gained', `${tempValue} Temp HP`);
          }
          
          console.log('Setting last change for character:', selectedCharacter.id, {
            type: primaryType,
            amount: totalAmount
          });
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
          
          // Add to combat log for each condition change
          const previousConditions = characterConditions[userCharacter.id] || [];
          const addedConditions = selectedConditions.filter(condition => !previousConditions.includes(condition));
          const removedConditions = previousConditions.filter(condition => !selectedConditions.includes(condition));
          
          console.log('Condition changes detected:', { 
            characterName: userCharacter.characterName, 
            addedConditions, 
            removedConditions 
          });
          
          addedConditions.forEach(condition => {
            console.log('Adding condition to log:', condition);
            addToCombatLog(userCharacter.characterName, 'Received', `${getConditionName(condition)} Condition`);
          });
          
          removedConditions.forEach(condition => {
            console.log('Removing condition from log:', condition);
            addToCombatLog(userCharacter.characterName, 'Lost', `${getConditionName(condition)} Condition`);
          });
          
          closeConditionsModal();
        } else {
          console.error('Failed to update conditions');
        }
      } catch (error) {
        console.error('Error updating conditions:', error);
      }
    }
  };

  const openConditionViewModal = (condition: string) => {
    setViewedCondition(condition);
    setIsConditionViewModalOpen(true);
  };

  const closeConditionViewModal = () => {
    setIsConditionViewModalOpen(false);
    setViewedCondition(null);
  };

  const openCombatLogModal = () => {
    setIsCombatLogModalOpen(true);
  };

  const closeCombatLogModal = () => {
    setIsCombatLogModalOpen(false);
  };

  const openSpellbookModal = async () => {
    setIsSpellbookModalOpen(true);
    
    // Load spells if not already loaded
    if (spells.length === 0) {
      try {
        // Load all spell documents
        const spellDocuments = [
          '/documents/spells_a_d.md',
          '/documents/spells_e_h.md',
          '/documents/spells_i_p.md',
          '/documents/spells_q_t.md',
          '/documents/spells_u_z.md'
        ];
        
        const allSpells: any[] = [];
        
        // Load each document
        for (const docPath of spellDocuments) {
          try {
            const response = await fetch(docPath);
            const text = await response.text();
            const parsedSpells = parseSpellsFromMarkdown(text);
            allSpells.push(...parsedSpells);
          } catch (error) {
            console.error(`Error loading ${docPath}:`, error);
          }
        }
        
        setSpells(allSpells);
        console.log(`Loaded ${allSpells.length} spells from all documents`);
      } catch (error) {
        console.error('Error loading spells:', error);
      }
    }
  };

  const parseSpellsFromMarkdown = (markdownText: string) => {
    const spells: any[] = [];
    
    // Split by ### headers to get individual spells
    const spellSections = markdownText.split(/^### /m).filter(section => section.trim());
    
    spellSections.forEach(section => {
      const lines = section.trim().split('\n');
      if (lines.length < 2) return;
      
      // First line is the spell name (without ### prefix)
      const name = lines[0].trim();
      if (!name) return;
      
      // Look for school info line (starts with * and ends with *)
      const schoolLine = lines.find(line => line.startsWith('*') && line.endsWith('*'));
      if (!schoolLine) return;
      
      const schoolInfo = schoolLine.replace(/\*/g, '').trim();
      
      // Extract properties (lines starting with *   ** or **)
      const properties: any = {};
      const propertyLines = lines.filter(line => 
        line.startsWith('*   **') || 
        (line.startsWith('**') && line.includes(':**'))
      );
      
      propertyLines.forEach(line => {
        // Handle both formats: *   **Key:** Value and **Key:** Value
        const match = line.match(/(?:\*\s+)?\*\*([^:]+):\*\*\s*(.+)/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          properties[key] = value;
        }
      });
      
      // Get description - everything after the last property line
      let lastPropertyIndex = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith('*   **') || 
            (lines[i].startsWith('**') && lines[i].includes(':**'))) {
          lastPropertyIndex = i;
          break;
        }
      }
      
      let description = '';
      if (lastPropertyIndex !== -1) {
        const descLines = lines.slice(lastPropertyIndex + 1);
        description = descLines.join(' ').trim();
      } else {
        // If no properties found, take everything after school info
        const schoolIndex = lines.findIndex(line => line.startsWith('*') && line.endsWith('*'));
        if (schoolIndex !== -1) {
          const descLines = lines.slice(schoolIndex + 1);
          description = descLines.join(' ').trim();
        }
      }
      
      // Only add if it looks like a spell (has school info and some content)
      if (schoolInfo && (Object.keys(properties).length > 0 || description)) {
        spells.push({
          name,
          schoolInfo,
          properties,
          description
        });
      }
    });
    
    return spells;
  };

  const closeSpellbookModal = () => {
    setIsSpellbookModalOpen(false);
  };

  const scrollToSection = (section: 'live' | 'tools') => {
    if (isScrolling) return; // Prevent multiple rapid scrolls
    
    setIsScrolling(true);
    
    if (section === 'live') {
      // Scroll to the very top of the page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setCurrentSection('live');
    } else if (section === 'tools') {
      // Scroll to the Tools section, ensuring the title is visible
      const toolsElement = document.getElementById('tools');
      if (toolsElement) {
        // Get the exact position of the Tools section container
        const toolsRect = toolsElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset + toolsRect.top;
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        setCurrentSection('tools');
      }
    }
    
    // Reset scrolling state after animation completes
    setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };


  const handleTouchStart = (e: React.TouchEvent) => {
    if (isScrolling) return; // Don't start new touch handling if already scrolling
    
    const touch = e.touches[0];
    const startY = touch.clientY;
    let hasTriggered = false;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (hasTriggered || isScrolling) return;
      
      const currentY = moveEvent.touches[0].clientY;
      const deltaY = startY - currentY;
      
      if (Math.abs(deltaY) > 80) { // Increased threshold for more deliberate swipes
        hasTriggered = true;
        if (deltaY > 0 && currentSection === 'live') {
          // Swiping up - go to tools
          scrollToSection('tools');
        } else if (deltaY < 0 && currentSection === 'tools') {
          // Swiping down - go to live
          scrollToSection('live');
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const addToCombatLog = async (characterName: string, action: string, details: string) => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/instances/${instanceId}/combat-log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterName,
          action,
          details
        }),
      });

      if (response.ok) {
        const newEntry = await response.json();
        console.log('Added to combat log:', newEntry);
        // Refresh combat log if modal is open
        if (isCombatLogModalOpen) {
          fetchCombatLog();
        }
      } else {
        console.error('Failed to add combat log entry');
      }
    } catch (error) {
      console.error('Error adding to combat log:', error);
    }
  };

  const fetchCombatLog = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/instances/${instanceId}/combat-log`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const logs = await response.json();
        setCombatLog(logs);
      } else {
        console.error('Failed to fetch combat log');
      }
    } catch (error) {
      console.error('Error fetching combat log:', error);
    }
  };

  const getConditionName = (filename: string) => {
    return filename.replace('.png', '').replace(/([A-Z])/g, ' $1').trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getHealthStatus = (currentHP: number, maxHP: number) => {
    const hpPercentage = (currentHP / maxHP) * 100;
    if (hpPercentage === 100) return 'Full Health';
    if (hpPercentage >= 75) return 'Healthy';
    if (hpPercentage >= 50) return 'Slightly Injured';
    if (hpPercentage >= 25) return 'Heavily Injured';
    if (hpPercentage >= 1) return 'In Danger';
    return 'Unconscious';
  };

  const getConditionDescription = (condition: string) => {
    const conditionDescriptions: {[key: string]: string} = {
      'concentration.png': 'Automatic loss: Casting a second spell that requires concentration will end the first one automatically.\nSaving throws: If you take damage, you must make a Constitution saving throw to maintain the spell.\nThe DC is 10 or half the damage taken (whichever is higher), to a maximum DC of 30.\nOther triggers: Concentration also ends if you have the Incapacitated condition or if you die.\nDuration: Concentration spells have a "Concentration" duration, which can last up to an hour, or until you end it early.\nLong casting times: Spells with a casting time of more than one action require concentration for the entire casting process, even if they aren\'t normally concentration spells. If you lose concentration, you must start the casting process over.',
      'stunned.png': 'While you have the Stunned condition, you experience the following effects.\nIncapacitated. You have the Incapacitated condition.\nSaving Throws Affected. You automatically fail Strength and Dexterity saving throws.\nAttacks Affected. Attack rolls against you have Advantage.',
      'invisible.png': 'While you have the Invisible condition, you experience the following effects.\nSurprise. If you\'re Invisible when you roll Initiative, you have Advantage on the roll.\nConcealed. You aren\'t affected by any effect that requires its target to be seen unless the effect\'s creator can somehow see you. Any equipment you are wearing or carrying is also concealed.\nAttacks Affected. Attack rolls against you have Disadvantage, and your attack rolls have Advantage. If a creature can somehow see you, you don\'t gain this benefit against that creature.',
      'incapacitated.png': 'While you have the Incapacitated condition, you experience the following effects.\nInactive. You can\'t take any action, Bonus Action, or Reaction.\nNo Concentration. Your Concentration is broken.\nSpeechless. You can\'t speak.\nSurprised. If you\'re Incapacitated when you roll Initiative, you have Disadvantage on the roll.',
      'paralyzed.png': 'While you have the Paralyzed condition, you experience the following effects.\nIncapacitated. You have the Incapacitated condition.\nSpeed 0. Your Speed is 0 and can\'t increase.\nSaving Throws Affected. You automatically fail Strength and Dexterity saving throws.\nAttacks Affected. Attack rolls against you have Advantage.\nAutomatic Critical Hits. Any attack roll that hits you is a Critical Hit if the attacker is within 5 feet of you.',
      'poisioned.png': 'While you have the Poisoned condition, you experience the following effect.\nAbility Checks and Attacks Affected. You have Disadvantage on attack rolls and ability checks.',
      'prone.png': 'While you have the Prone condition, you experience the following effects.\nRestricted Movement. Your only movement options are to crawl or to spend an amount of movement equal to half your Speed (round down) to right yourself and thereby end the condition. If your Speed is 0, you can\'t right yourself.\nAttacks Affected. You have Disadvantage on attack rolls. An attack roll against you has Advantage if the attacker is within 5 feet of you. Otherwise, that attack roll has Disadvantage.',
      'restrained.png': 'While you have the Restrained condition, you experience the following effects.\nSpeed 0. Your Speed is 0 and can\'t increase.\nAttacks Affected. Attack rolls against you have Advantage, and your attack rolls have Disadvantage.\nSaving Throws Affected. You have Disadvantage on Dexterity saving throws.',
      'exhaustion.png': 'While you have the Exhaustion condition, you experience the following effects.\nExhaustion Levels. This condition is cumulative. Each time you receive it, you gain 1 Exhaustion level. You die if your Exhaustion level is 6.\nD20 Tests Affected. When you make a D20 Test, the roll is reduced by 2 times your Exhaustion level.\nSpeed Reduced. Your Speed is reduced by a number of feet equal to 5 times your Exhaustion level.\nRemoving Exhaustion Levels. Finishing a Long Rest removes 1 of your Exhaustion levels. When your Exhaustion level reaches 0, the condition ends.'
    };
    return conditionDescriptions[condition] || 'Condition description not available.';
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
      <div
      className="min-h-screen bg-cover bg-center overflow-hidden" 
      style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}
      onTouchStart={handleTouchStart}
    >
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

          {/* Live Instance Section - Everything in one section */}
          <div id="live" className="mb-6 min-h-screen flex flex-col justify-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instance.instanceCharacters
              .sort((a, b) => b.initiative - a.initiative) // Sort by initiative descending
              .map((character) => {
              const hpPercentage = (character.currentHP / character.maxHP) * 100;
              const isCurrentUser = currentUser && character.user.id === currentUser.id;
              
              console.log(`Rendering character ${character.characterName} (ID: ${character.id}), lastChange:`, character.lastChangeType, character.lastChangeAmount);
              return (
                <div key={character.id} className="relative bg-white/10 border border-white/20 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-semibold">
                      {character.characterName} ({character.initiative})
                    </h3>
                    {character.lastChangeType && character.lastChangeAmount && (
                      <div className={`text-sm font-medium ${
                        character.lastChangeType === 'damage' ? 'text-red-400' :
                        character.lastChangeType === 'healing' ? 'text-green-400' :
                        'text-blue-400'
                      }`}>
                        {character.lastChangeType === 'damage' ? '-' : '+'}
                        {character.lastChangeAmount}
                        {character.lastChangeType === 'tempHP' ? ' Temp HP' : ' HP'}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    {/* Show HP bar for DM or for current user's own character */}
                    {currentUser?.role === 'Dungeon Master' || isCurrentUser ? (
                      <>
                        <div className="flex justify-between text-sm mb-1">
                          <span>HP</span>
                          <span>
                            {character.currentHP}/{character.maxHP}
                            {character.tempHP > 0 && (
                              <span className="text-blue-400"> (+{character.tempHP})</span>
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
                          {/* Main HP bar */}
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              hpPercentage > 50 ? 'bg-green-500' : 
                              hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                          ></div>
                          {/* Temp HP bar (blue gradient) */}
                          {character.tempHP > 0 && (
                            <div 
                              className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, (character.tempHP / character.maxHP) * 100)}%`,
                                position: 'absolute',
                                top: 0,
                                left: `${Math.max(0, Math.min(100, hpPercentage))}%`,
                                zIndex: 1
                              }}
                            ></div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Show health status text for other players' characters */
                      <div className="text-center">
                        <div className="text-sm text-gray-300 mb-1">Health Status:</div>
                <div className={`text-sm font-medium ${
                  hpPercentage === 100 ? 'text-green-500' :
                  hpPercentage >= 75 ? 'text-green-400' :
                  hpPercentage >= 50 ? 'text-yellow-400' :
                  hpPercentage >= 25 ? 'text-orange-400' :
                  hpPercentage >= 1 ? 'text-red-400' : 'text-red-600'
                }`}>
                          {getHealthStatus(character.currentHP, character.maxHP)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Conditions Display */}
                  {characterConditions[character.id] && characterConditions[character.id].length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {characterConditions[character.id].map((condition, index) => (
                        <div key={index} className="flex items-center">
                          <img 
                            src={`/images/conditions/${condition}`}
                            alt={getConditionName(condition)}
                            className="w-6 h-6 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                            title={`Click to view ${getConditionName(condition)} details`}
                            onClick={() => openConditionViewModal(condition)}
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

            {/* Player-only tools - INSIDE Live Instance section */}
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
          </div>

          {/* Tools Section - One mobile screen below Live Instance */}
          <div id="tools" className="mt-96 mb-8 min-h-screen">
            {/* Tools Title at the top */}
            <h2 className="text-2xl font-bold text-[#e2e2bf] mb-6 text-center">Tools</h2>
            

            {/* Tools - App store style layout */}
            <div className="flex justify-start space-x-4 px-4">
              {/* Spellbook - Available to all users */}
              <button 
                onClick={openSpellbookModal}
                className="w-20 h-20 bg-transparent border-2 border-[#e2e2bf] rounded-lg hover:bg-[#e2e2bf]/10 transition-colors flex flex-col items-center justify-center"
              >
                <img 
                  src="/icons/spellbook.png" 
                  alt="Spellbook" 
                  className="w-12 h-12 mb-1"
                />
                <span className="text-[#e2e2bf] text-xs font-medium">Spellbook</span>
              </button>
              
              {/* Combat Log - DM only */}
              {currentUser?.role === 'Dungeon Master' && (
                <button 
                  onClick={openCombatLogModal}
                  className="w-20 h-20 bg-transparent border-2 border-[#e2e2bf] rounded-lg hover:bg-[#e2e2bf]/10 transition-colors flex flex-col items-center justify-center"
                >
                  <img 
                    src="/icons/combatlog.png" 
                    alt="Combat Log" 
                    className="w-12 h-12 mb-1"
                  />
                  <span className="text-[#e2e2bf] text-xs font-medium">Combat Log</span>
                </button>
              )}
            </div>
          </div>



          {/* HP Change Modal */}
          {isHPModalOpen && selectedCharacter && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 relative">
                {/* Close button */}
                <button
                  onClick={closeHPModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h3 className="text-xl font-bold text-white mb-6 pr-8">Update HP for {selectedCharacter.characterName}</h3>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-300 mb-4">
                    Current HP: {selectedCharacter.currentHP}/{selectedCharacter.maxHP}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Suffer Damage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Suffer</label>
                      <input
                        type="number"
                        value={sufferAmount}
                        onChange={(e) => setSufferAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600"
                        placeholder="Enter damage amount"
                        min="0"
                      />
                    </div>
                    
                    {/* Heal */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Heal</label>
                      <input
                        type="number"
                        value={healAmount}
                        onChange={(e) => setHealAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600"
                        placeholder="Enter healing amount"
                        min="0"
                      />
                    </div>
                    
                    {/* Temp HP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Temp HP</label>
                      <input
                        type="number"
                        value={tempHP}
                        onChange={(e) => setTempHP(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600"
                        placeholder="Enter temp HP amount"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={updateHP}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conditions Modal */}
          {isConditionsModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
                {/* Close button in top right */}
                <button
                  onClick={closeConditionsModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Select Conditions</h3>
                  <p className="text-slate-300">Choose conditions to apply to your character</p>
                </div>
                
                {/* Conditions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  {[
                    'concentration.png',
                    'stunned.png',
                    'invisible.png',
                    'incapacitated.png',
                    'paralyzed.png',
                    'poisioned.png',
                    'prone.png',
                    'restrained.png',
                    'exhaustion.png'
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

                {/* Condition Details */}
                {selectedConditions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-white font-semibold mb-3">Condition Details:</h4>
                    <div className="space-y-3">
                      {selectedConditions.map((condition, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                          <div className="flex items-start gap-3">
                            <img 
                              src={`/images/conditions/${condition}`}
                              alt={getConditionName(condition)}
                              className="w-6 h-6 object-contain flex-shrink-0 mt-1"
                            />
                            <div className="flex-1">
                              <h5 className="text-white font-medium mb-2">{getConditionName(condition)}:</h5>
                              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                {getConditionDescription(condition)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-center">
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

          {/* Condition View Modal */}
          {isConditionViewModalOpen && viewedCondition && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 relative">
                {/* Close button in top right */}
                <button
                  onClick={closeConditionViewModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{getConditionName(viewedCondition)}</h3>
                  <p className="text-slate-300">Condition Details</p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-start gap-3">
                    <img 
                      src={`/images/conditions/${viewedCondition}`}
                      alt={getConditionName(viewedCondition)}
                      className="w-12 h-12 object-contain flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                        {getConditionDescription(viewedCondition)}
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          )}

          {/* Combat Log Modal */}
          {isCombatLogModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
                {/* Close button in top right */}
                <button
                  onClick={closeCombatLogModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Combat Log</h3>
                  <p className="text-slate-300">Track all player actions and changes</p>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {combatLog.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      No actions recorded yet
                    </div>
                  ) : (
                    combatLog.map((entry) => (
                      <div key={entry.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{entry.characterName}</span>
                              <span className="text-slate-300">{entry.action}</span>
                              <span className="text-blue-300">{entry.details}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(entry.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
              </div>
            </div>
          )}

          {/* Spellbook Modal */}
          {isSpellbookModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
                {/* Close button in top right */}
                <button
                  onClick={closeSpellbookModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Spellbook</h3>
                  <p className="text-slate-300">
                    Browse and reference spells
                    {spells.length > 0 && (
                      <span className="block text-sm text-purple-300 mt-1">
                        {spells.length} spells loaded
                      </span>
                    )}
                  </p>
                </div>
                
                {/* Search Field */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search spells..."
                    value={spellSearchTerm}
                    onChange={(e) => setSpellSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                {/* Spells List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {spells.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      Loading spells from all documents...
                    </div>
                  ) : (
                    spells
                      .filter(spell => 
                        spell.name.toLowerCase().includes(spellSearchTerm.toLowerCase()) ||
                        spell.schoolInfo.toLowerCase().includes(spellSearchTerm.toLowerCase()) ||
                        spell.description.toLowerCase().includes(spellSearchTerm.toLowerCase())
                      )
                      .map((spell, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-white">{spell.name}</h4>
                            <span className="text-sm text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                              {spell.schoolInfo}
                            </span>
                          </div>
                          
                          {/* Properties */}
                          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            {Object.entries(spell.properties).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="text-slate-400 font-medium w-20">{key}:</span>
                                <span className="text-white">{value as string}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Description */}
                          <div className="text-slate-300 text-sm leading-relaxed">
                            {spell.description}
                          </div>
                        </div>
                      ))
                  )}
                  
                  {spells.length > 0 && spells.filter(spell => 
                    spell.name.toLowerCase().includes(spellSearchTerm.toLowerCase()) ||
                    spell.schoolInfo.toLowerCase().includes(spellSearchTerm.toLowerCase()) ||
                    spell.description.toLowerCase().includes(spellSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center text-slate-400 py-8">
                      No spells found matching "{spellSearchTerm}"
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
