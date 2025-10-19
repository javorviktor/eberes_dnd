'use client';
import { useState } from 'react';
import { API_URL } from '../../lib/api';

// D&D 5e Races
const RACES = [
  { id: 'human', name: 'Human', description: 'Versatile and ambitious, humans are the most adaptable of the common races.' },
  { id: 'elf', name: 'Elf', description: 'Graceful and long-lived, elves are known for their keen senses and magical affinity.' },
  { id: 'dwarf', name: 'Dwarf', description: 'Hardy and traditional, dwarves are known for their craftsmanship and resilience.' },
  { id: 'halfling', name: 'Halfling', description: 'Small and brave, halflings are known for their luck and courage.' },
  { id: 'dragonborn', name: 'Dragonborn', description: 'Proud and strong, dragonborn are descendants of dragons with draconic powers.' },
  { id: 'gnome', name: 'Gnome', description: 'Curious and inventive, gnomes are known for their intelligence and magical abilities.' },
  { id: 'half-elf', name: 'Half-Elf', description: 'Combining human versatility with elven grace, half-elves are natural diplomats.' },
  { id: 'half-orc', name: 'Half-Orc', description: 'Strong and fierce, half-orcs combine human ambition with orcish strength.' },
  { id: 'tiefling', name: 'Tiefling', description: 'Descendants of fiends, tieflings are known for their infernal heritage and charisma.' },
];

const CLASSES = [
  { id: 'barbarian', name: 'Barbarian' },
  { id: 'bard', name: 'Bard' },
  { id: 'cleric', name: 'Cleric' },
  { id: 'druid', name: 'Druid' },
  { id: 'fighter', name: 'Fighter' },
  { id: 'monk', name: 'Monk' },
  { id: 'paladin', name: 'Paladin' },
  { id: 'ranger', name: 'Ranger' },
  { id: 'rogue', name: 'Rogue' },
  { id: 'sorcerer', name: 'Sorcerer' },
  { id: 'warlock', name: 'Warlock' },
  { id: 'wizard', name: 'Wizard' },
];

const TOTAL_STEPS = 3; // Name, Race, Class

export default function CharacterCreationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [characterData, setCharacterData] = useState({
    race: '',
    class: '',
    name: '',
    level: 1,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    }
  });

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const handleNameChange = (name: string) => {
    setCharacterName(name);
    setCharacterData(prev => ({ ...prev, name }));
  };

  const handleRaceSelect = (raceId: string) => {
    setSelectedRace(raceId);
    setCharacterData(prev => ({ ...prev, race: raceId }));
  };

  const handleClassPrevious = () => {
    setCurrentClassIndex(prev => prev === 0 ? CLASSES.length - 1 : prev - 1);
  };

  const handleClassNext = () => {
    setCurrentClassIndex(prev => prev === CLASSES.length - 1 ? 0 : prev + 1);
  };

  const handleClassSelect = () => {
    const currentClass = CLASSES[currentClassIndex];
    setSelectedClass(currentClass.id);
    setCharacterData(prev => ({ ...prev, class: currentClass.id }));
  };

  const handleCreateCharacter = async () => {
    if (!characterName.trim() || !selectedRace || !selectedClass) {
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: characterName,
          race: selectedRace,
          class: selectedClass,
          level: 1,
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        }),
      });

      if (response.ok) {
        // Character created successfully, redirect to home
        window.location.replace('/home');
      } else {
        console.error('Failed to create character');
      }
    } catch (error) {
      console.error('Error creating character:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      // Mark current step as completed before moving to next
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      // Remove the previous step from completed when going back
      setCompletedSteps(prev => prev.filter(step => step !== currentStep - 1));
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-lg font-cinzel">Give your character a memorable name</h2>
      </div>

      <div className="space-y-4">
        <div>
          <input
            id="character-name"
            type="text"
            value={characterName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter your character's name..."
            className="w-full px-0 py-3 border-0 border-b-2 focus:outline-none focus:ring-0 text-lg bg-transparent font-cinzel text-white placeholder-white placeholder-opacity-70"
            style={{ borderBottomColor: '#e2e2bf' }}
            maxLength={50}
          />
          <p className="text-xs text-white mt-1 drop-shadow-md font-cinzel opacity-70">
            {characterName.length}/50 characters
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-lg font-cinzel">Choose Your Race</h2>
      </div>

      <div className="space-y-3">
        {RACES.map((race) => (
          <button
            key={race.id}
            onClick={() => handleRaceSelect(race.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all backdrop-blur-sm ${
              selectedRace === race.id
                ? 'border-blue-500 bg-blue-50 bg-opacity-95 shadow-md'
                : 'border-slate-200 bg-white bg-opacity-90 hover:border-slate-300 hover:shadow-sm hover:bg-opacity-95'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1 font-cinzel">{race.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-cinzel">{race.description}</p>
              </div>
              {selectedRace === race.id && (
                <div className="ml-3 flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const currentClass = CLASSES[currentClassIndex];
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-lg font-cinzel">Choose a Class</h2>
        </div>

        {/* Class Carousel */}
        <div className="flex items-center justify-center space-x-4">
          {/* Left Arrow */}
          <button
            onClick={handleClassPrevious}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all backdrop-blur-sm"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Current Class Display */}
          <div className="flex-1 max-w-xs">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-slate-900 font-cinzel mb-2">
                {currentClass.name}
              </h3>
              <p className="text-sm text-slate-600 font-cinzel">
                {currentClassIndex + 1} of {CLASSES.length}
              </p>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleClassNext}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all backdrop-blur-sm"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Class Details Placeholder */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-6">
          <h4 className="text-lg font-semibold text-slate-900 font-cinzel mb-3">
            {currentClass.name}'s Details
          </h4>
          <p className="text-slate-600 font-cinzel mb-4">
            This section will contain detailed information about the {currentClass.name} class, including abilities, features, and playstyle.
          </p>
          
          {/* Select Class Button */}
          <button
            onClick={handleClassSelect}
            className={`w-full py-3 px-4 rounded-lg font-cinzel font-medium transition-all ${
              selectedClass === currentClass.id
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {selectedClass === currentClass.id ? 'Selected' : 'Select Class'}
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Coming Soon!</h2>
            <p className="text-slate-600">This step is under development</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/ui/tavern_background.png)' }}
      />
      
      {/* Overlay for better readability */}
      <div className="fixed inset-0 bg-black bg-opacity-40" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Progress Bar */}
        <div className="max-w-md mx-auto px-4 py-4">
          {/* Segmented Progress Bar */}
          <div className="w-full h-2 mb-4 flex gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => {
              const stepNumber = index + 1;
              const isCompleted = completedSteps.includes(stepNumber);
              const isCurrent = stepNumber === currentStep;
              
              let backgroundColor = '#353535'; // Default: skipped/not filled
              if (isCompleted) {
                backgroundColor = '#688b59'; // Green: completed
              } else if (isCurrent) {
                backgroundColor = '#e2e2bf'; // Light yellow: current
              }
              
              return (
                <div
                  key={stepNumber}
                  className="flex-1 rounded-full transition-all duration-300 ease-out"
                  style={{ backgroundColor }}
                />
              );
            })}
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            {currentStep > 1 ? (
              <button 
                onClick={handlePrevStep}
                className="flex items-center text-white hover:text-slate-200 font-cinzel drop-shadow-md"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !characterName.trim()) ||
                  (currentStep === 2 && !selectedRace)
                }
                className="flex items-center text-white hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-cinzel drop-shadow-md"
              >
                Next
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : currentStep === 3 ? (
              <button
                onClick={handleCreateCharacter}
                disabled={!characterName.trim() || !selectedRace || !selectedClass || isCreating}
                className="flex items-center text-white hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-cinzel drop-shadow-md"
              >
                {isCreating ? 'Creating...' : 'Create Character'}
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            ) : (
              <div></div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto px-4 py-6">
        {renderCurrentStep()}

        </div>
      </div>
    </div>
  );
}
