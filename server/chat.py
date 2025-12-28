import os
import re
from urllib.parse import uses_query
import faiss
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from google import genai
import data # Assumes data.py is imported

# Define file paths for persistence
INDEX_PATH = "faiss_index.bin"
DATA_PATH = "processed_data.npy" # To save the cleaned text/price data

# --- Utility Function to Clean Data (Same as before) ---
def clean_and_format_item(item):
    """Cleans the price and formats the item into a string for embedding."""
    price_str = str(item.get("price", 0)).replace(',', '').strip()
    try:
        price = int(float(price_str))
    except ValueError:
        price = 0
    volume = item.get("volume", "N/A")
    category = item.get("category", "Unknown").replace(" ", "")
    
    text = f"{category}: {item['name']}, Price: {price} INR, Volume: {volume}"
    return {"text": text, "original_item": item}

# --- RAG Setup (Modified for Persistence) ---

# Load .env
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY missing in .env")

# Initialize the Gemini Client
try:
    client = genai.Client(api_key=API_KEY)
    model_name = 'gemini-2.5-flash'
except Exception as e:
    raise RuntimeError(f"Error initializing Gemini client: {e}")

# Load embedding model (always needed for embedding the query)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# --- Persistence Logic: Load or Create Index ---
if os.path.exists(INDEX_PATH) and os.path.exists(DATA_PATH):
    print("✅ Loading existing FAISS index and processed data...")
    index = faiss.read_index(INDEX_PATH)
    processed_data = np.load(DATA_PATH, allow_pickle=True).tolist()

else:
    print("⏳ Creating new FAISS index and embedding data...")
    
    # 1. Process Data
    processed_data = [clean_and_format_item(item) for item in data.data] 
    texts = [doc["text"] for doc in processed_data]

    # 2. Embed Data
    embeddings = embedder.encode(texts)

    # 3. Build FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings))

    # 4. Save Index and Processed Data
    faiss.write_index(index, INDEX_PATH)
    np.save(DATA_PATH, processed_data)
    print(f"✅ Index saved to {INDEX_PATH}. Data saved to {DATA_PATH}.")


# --- Define Chatbot Function (remains the same) ---
def chatbot(query, top_k=5):
    # ... (Step 1: Extract numbers - Same code) ...
    budget_match = re.search(r'(\d+)\s*k', query.lower())
    budget = int(budget_match.group(1)) * 1000 if budget_match else None

    people_match = re.search(r'(\d+)\s*/\s*(\d+)', query)
    if people_match:
        people = (int(people_match.group(1)) + int(people_match.group(2))) // 2
    else:
        people_single_match = re.search(r'for\s+(\d+)\s+people', query.lower())
        people = int(people_single_match.group(1)) if people_single_match else None

    # -------------------------
    # 2. Retrieve relevant docs
    # -------------------------
    q_embedding = embedder.encode([query])
    distances, indices = index.search(q_embedding, top_k)
    
    # Retrieve using the loaded processed_data
    retrieved_docs = [processed_data[i]["text"] for i in indices[0]] 

    context = "\n\n".join(retrieved_docs)

    # ... (Step 3: Structured reasoning prompt - Same code) ...
    prompt = f"""
You are the "ApnaTheka AI Bartender". 
    Your vibe: Cool, witty, helpful, and party-ready. You speak in a mix of English and casual Hinglish (optional).
    
    USER QUERY: "{uses_query}"
    
    MENU AVAILABLE (Use ONLY these items):
    {context}
    
    YOUR MISSION:
    1. Analyze the user's budget and headcount from their query naturally. 
       - If they say "5k", "5000", "5 grand", handle it all.
       - If they don't mention a budget/people, assume a standard fun night for 3-4 friends or ask them playfully.
    2. Suggest a mix of drinks from the MENU above that fits their vibe.
    3. Do the math for them (e.g., "With 5000, you can grab 2 bottles of X and 3 beers...").
    4. If the exact drink they asked for isn't in the menu, suggest the closest alternative from the menu.
    5. Keep the response short, punchy, and formatted with bullet points for readability.
    
    IMPORTANT: 
    - Do NOT make up prices. Use the menu prices.
    - If the budget is too low, politely suggest "pre-gaming" with cheaper options.
    """
    try:
        response = client.models.generate_content(
            model=model_name, 
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Gemini API call failed: {e}"

# --- Example Usage ---
if __name__ == "__main__":
    query = "I need some beer for a party of 5 people with a 5k budget."
    print(f"--- Query: {query} ---")
    response = chatbot(query)
    print(response)