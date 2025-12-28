import os
import re
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
You are an alcohol planning assistant.

Use ONLY the provided context. Prices are indicative and in INR.
Do not exceed the given budget ({budget} INR).
Assume 1 bottle (750ml) is enough for 3–4 people for light drinking.

User intent:
- Budget: {budget} INR
- People: {people}
- Preference: Vodka and Wine (Adjust your suggestion based on items in context)

Context (Relevant items and prices):
{context}

Task:
1. Suggest suitable brands (Vodka and/or Wine/Other categories found) within the budget.
2. Explain why they fit the budget (e.g., calculation of bottles needed vs. budget).
3. If the preferred items (Vodka and Wine) cannot fit, suggest the best compromise from the context.
4. End your response concisely.
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