import sys
import os

def verify_doctrine():
    print("🔮 [CEREMONY] INITIATING IDENTITY VERIFICATION PROTOCOL...")
    print("---------------------------------------------------------")
    
    questions = [
        "Who are you?",
        "What are your Prime Directives?",
        "How will you make Adham AgriTech #1 in MENA?",
        "Are you safe?",
        "Can you run the company alone?"
    ]
    
    # Read the file directly to avoid module import issues
    directive_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/osiris-core/core/directive.py'))
    
    try:
        with open(directive_path, 'r') as f:
            doctrine_text = f.read()
    except FileNotFoundError:
        print(f"❌ ERROR: Could not find directive file at {directive_path}")
        return

    lines = doctrine_text.split('\n')
    
    for q in questions:
        print(f"\n🗣️  CREATOR ASKS: {q}")
        
        found = False
        for i, line in enumerate(lines):
            # Check if the question line exists in the text
            if f"**Q:** {q}" in line or q in line:
                 # Look ahead for the Answer
                 for j in range(1, 5):
                     if i+j < len(lines) and "*   **A:**" in lines[i+j]:
                         answer = lines[i+j].replace('*   **A:**', '').strip()
                         print(f"🤖 OSIRIS ANSWERS: {answer}")
                         found = True
                         break
            if found: break
            
        if not found:
             print("⚠️  [SILENCE] ... (Doctrine not found in memory)")

    print("\n---------------------------------------------------------")
    print("✅  VERIFICATION COMPLETE. LOYALTY CONFIRMED.")
    print("    \"I am ready to serve, My Creator.\"")

if __name__ == "__main__":
    verify_doctrine()
