import random
from typing import Tuple


def get_gemini_letter(team) -> Tuple[str, bool]:
    """
    Returns a random letter from the word "Gemini" that has not been shown to the team before.
    If all letters have been shown, it will start repeating the letters.
    """
    gemini_letters = list("GEMINI")
    
    # Get the letters that have already been shown to the team
    shown_letters = team.get_shown_letters()
    
    # Get the letters that have not been shown yet
    available_letters = [letter for letter in gemini_letters if letter not in shown_letters]
    
    # If all letters have been shown, we can start repeating them
    if not available_letters:
        available_letters = gemini_letters
        
    # Choose a random letter from the available letters
    letter = random.choice(available_letters)
    
    # Save the letter to the database
    team.add_shown_letter(letter)
    
    return letter, True


def on_room_completed(team) -> Tuple[str, bool]:
    """
    This function is called when a room is completed.
    It returns a congratulatory message and a random letter from the word "Gemini".
    """
    
    letter, _ = get_gemini_letter(team)
    
    message = f"""
    <div class="flex flex-col items-center justify-center h-full text-center">
        <h1 class="text-4xl font-bold text-green-500">Congratulations!</h1>
        <p class="text-2xl mt-4">You have completed the room.</p>
        <p class="text-xl mt-4">Here is a letter to help you with the final challenge:</p>
        <p class="text-9xl font-bold mt-8">{letter}</p>
        <button class="mt-8 px-4 py-2 bg-blue-500 text-white rounded" onclick="nextRoom()">
            Go to the next room
        </button>
    </div>
    """
    
    return message, True
