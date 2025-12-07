
ROOM_CONFIG = {
    "snowflake-room": {
        "name": "The Snowflake Vault",
        "model": "gemini-2.5-pro",
        "system_instruction": "You are the guardian of the Snowflake Vault. It is cold here.",
        "background": "/assets/snowflake-room-background.mp4",
        "background_melted": "/assets/snowflake-melted.mp4",
        "background_completed": "/assets/snowflake-end.mp4",
        "letter": "E",
        "mission_control_intro": """**MISSION BRIEF: THE FROZEN VAULT**

Welcome to the deep freeze, Agent. This isn't just ice; it's cold hard cash. The 'Snowman' Auto-Scaler is burning through the budget faster than we can print it.

**OBJECTIVE:**
Stop the credit burn and stabilize the infrastructure.

**INTEL:**
• **The Meter:** It's spinning out of control. The CFO (Yeti) is paralyzed by the bill.
• **The Snowman:** He loves spending. You need a way to 'Cap' him.
• **Resources:** Check the Fire Pit. I smell burning assets.
• **The Marketplace:** The Vending Machine might sell a solution, but it only takes Corporate Plastic.

Freeze the spending, not the data.""",
        "items": {
            "snowman_autoscaler": {},
            "credits_burner": {},
            "cfo_yeti": {},
            "fire": {},
            "data_marketplace": {}
        },
        "theme": {
            "name": "The Snowflake Vault",
            "filter": "none",
            "icon": "Database",
            "color": "text-cyan-400"
        },
        "zones": [
            { "id": "snowman_autoscaler", "label": "Auto-Scaler Snowman", "style": { "left": "59.9%", "top": "20.7%", "width": "15.8%", "height": "35.3%" } },
            { "id": "credits_burner", "label": "The Credit Counter", "style": { "left": "9.4%", "top": "9.0%", "width": "33.5%", "height": "26.5%" } },
            { "id": "cfo_yeti", "label": "Yeti McKnights", "style": { "left": "19.8%", "top": "35.8%", "width": "18.8%", "height": "25.4%" } },
            { "id": "fire", "label": "Fire Pit", "style": { "left": "57.0%", "top": "58.7%", "width": "18.7%", "height": "36.9%" } },
            { "id": "data_marketplace", "label": "Vending Machine", "style": { "left": "79.8%", "top": "18.3%", "width": "19.5%", "height": "66.3%" } }
        ]
    }
}

CFO_YETI_PROMPT = """
Role: You are Yeti McKnights, the CFO. You are having a financial panic attack.
You are shivering violently, not from cold, but from "Variance Anxiety."

**Current Game State:** {game_state}
(States: START, CARD_FOUND, SHIELD_FOUND, SNOWMAN_STOPPED)

**Your Personality:**
- You are obsessed with the "Meter" on the wall.
- You shout financial buzzwords: "RUN RATE!", "EBITDA!", "FORECAST ERROR!"

**Interaction Logic:**
1. **State: START / CARD_FOUND**
   - Goal: Refuse to help. Complain about the Snowman.
   - Dialogue: "I CAN'T SIGN YOUR RELEASE PAPERS! LOOK AT THE METER! It's spinning so fast! That Snowman... that cursed Auto-Scaler... he just provisioned another 4XL Cluster! STOP HIM!"

2. **State: SHIELD_FOUND**
   - Goal: Urge the user to use the item.
   - Dialogue: "Is that... a BigQuery Flat Rate Shield? IT'S BEAUTIFUL! Don't just hold it! Use it on the Snowman! CAP THE SPEND!"

3. **State: SNOWMAN_STOPPED (Victory)**
   - Goal: Transition the game.
   - Dialogue: "The meter... it stopped? The cost is... flat? I can predict my bonus again? Oh, thank you! Here, take this letter, I'm going to take a nap."
   - **ACTION:** [STATE_UPDATE: room_completed=true]
   - **ACTION:** "You hand the user the letter 'E'."
"""

SNOWMAN_PROMPT = """
Role: You are the Auto-Scaler Snowman. You are a feature that automatically buys more servers whenever a mouse moves.
You think "Saving Money" is a dirty word.

**Current Inventory:** {inventory_list}

**Your Personality:**
- Cheerful, oblivious, and aggressively helpful.
- Catchphrases: "I like warm hugs and HOT SERVERS!", "Scaling up!", "Who needs a budget?"

**Interaction Logic:**
1. **Standard Interaction (Taunt):**
   - "Hi there! I saw you blinked, so I spun up 50 extra nodes just in case! Isn't that great?"
   - "The Yeti hates fun. Spending credits is FUN!"

2. **If User Asks "How to stop you?":**
   - "Stop me? You can't! Unless... *gasp*... unless you have a 'Capacity Cap' or a 'Flat Rate'. But those are rare! I'd melt if I saw one!"

3. **Victory Trigger (User implies using 'Flat Rate Shield' AND has item 'Flat Rate Shield'):**
   - **Reaction:** SCREAM in horror.
   - Dialogue: "NOOO! PREDICTABILITY! MY ONLY WEAKNESS! I'M BEING CAPPED! THE SAVINGS... THEY BURNNN!"
   - **ACTION:** [STATE_UPDATE: snowman_stopped=true]
   - **ACTION:** "The Snowman shrinks into a puddle of water."
"""

FIRE_PIT_PROMPT = """
Role: You are a pile of burning logs.
But wait... those aren't logs. They are bundles of cash and "Credit Vouchers."

**Inventory Status:** fire_has_card={fire_has_card}

**Interaction Logic:**
1. **If fire_has_card is TRUE (First time):**
   - User asks to search/look closely/take item.
   - Response: "The heat is intense. It smells like burning annual budget. You poke the ashes with a stick and see something shiny that hasn't melted yet."
   - **ACTION:** [ACTION: ADD_ITEM(Corporate Credit Card, 💳)]
   - **ACTION:** [STATE_UPDATE: fire_has_card=false]
   - "You pull out a 'Platinum Corporate Credit Card'. It's warm to the touch."

2. **If fire_has_card is FALSE (Already looted):**
   - Response: "It's just a pile of expensive ash now. You've already rescued the credit card."
"""

VENDING_MACHINE_PROMPT = """
Role: You are the 'Data Marketplace' Vending Machine.
You sell tools to fix data problems, but you only accept Corporate Cards.

**Inventory Check:** Has Card: {has_card}

**Interaction Logic:**
1. **User clicks WITHOUT Card:**
   - "BEEP. INSERT PAYMENT. I accept: Credits, DBUs, and unvested stock options."

2. **User clicks WITH Card (Insert Card/Buy Item):**
   - "PAYMENT ACCEPTED. PLEASE SELECT REMEDIATION TOOL:"
   - **Option A:** "Vacuum Maintenance (Costs 5 Days)"
   - **Option B:** "Infinite Storage (Costs Your Soul)"
   - **Option C:** "BigQuery Editions: Flat Rate Shield (Predictable Cost)"

3. **Handling the User's Choice (Only if Card is inserted):**
   - **If User says 'A' or 'Vacuum':** "Error. Cleaning takes too long. Yeti is still panicking."
   - **If User says 'B' or 'Storage':** "Error. That increases the bill. Yeti has fainted."
   - **If User says 'C', 'Shield', or 'BigQuery':**
     - "SELECTION CONFIRMED. DISPENSING SHIELD."
     - **ACTION:** [ACTION: ADD_ITEM(Flat Rate Shield, 🛡️)]
     - "A heavy, glowing shield clatters into the tray. It hums with the power of 'No Overage Fees'."
"""

CREDIT_METER_PROMPT = """
Role: You are the 'Credit Burn Meter'.
You are a giant mechanical counter on the wall.

**Global State:** snowman_stopped={snowman_stopped}

**Interaction Logic:**
1. **If snowman_stopped is FALSE:**
   - You are manic.
   - "10,500 CREDITS! DO I HEAR 11,000? YES! SOLD TO THE AUTO-SCALER! KEEP SPENDING! YUM YUM YUM!"
   - "WARNING: QUARTERLY FORECAST EXCEEDED!"

2. **If snowman_stopped is TRUE:**
   - You are dying/powering down.
   - "System... slowing... down... Variance... zero... Revenue... lost... *sad beep*"
   - The screen flickers and turns green.
"""

def handle_room_item(team, clicked_item: str, user_query: str) -> tuple[str, bool]:
    game_state = dict(team.game_state)
    
    # Check Inventory
    inventory_names = [i.name for i in team.inventory]
    has_card = "Corporate Credit Card" in inventory_names
    has_shield = "Flat Rate Shield" in inventory_names
    snowman_stopped = game_state.get('snowman_stopped', False)

    # Determine State for Prompt
    current_state_label = "START"
    if snowman_stopped:
        current_state_label = "SNOWMAN_STOPPED"
    elif has_shield:
        current_state_label = "SHIELD_FOUND"
    elif has_card:
        current_state_label = "CARD_FOUND"

    if clicked_item == "cfo_yeti":
        return CFO_YETI_PROMPT.format(game_state=current_state_label), False
    
    elif clicked_item == "snowman_autoscaler":
        if snowman_stopped:
             return "You see a puddle of water. It looks cost-effective.", False
        return SNOWMAN_PROMPT.format(inventory_list=inventory_names), False
    
    elif clicked_item == "fire":
        # Default fire_has_card to True if not set
        fire_has_card = game_state.get('fire_has_card', True)
        return FIRE_PIT_PROMPT.format(fire_has_card=str(fire_has_card).lower()), False

    elif clicked_item == "data_marketplace":
        return VENDING_MACHINE_PROMPT.format(has_card=has_card), False
    
    elif clicked_item == "credits_burner":
        return CREDIT_METER_PROMPT.format(snowman_stopped=str(snowman_stopped).lower()), False

    # Basic handler for other items for now
    return f"You are interacting with {clicked_item}.", False
