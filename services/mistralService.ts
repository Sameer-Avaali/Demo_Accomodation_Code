import { Amenity, Listing, HotelStyle } from '../types';

// Using the Mistral API Key and the NEW Agent ID provided by the user.
const MISTRAL_API_KEY = "bsjJrfgyAg9sgoaP5agPKJBIB9y1wjl5";
const MISTRAL_AGENT_ID = "ag:a55ae5ed:20251010:accomodation-ai-agent:1398d2f8";
const MISTRAL_AGENT_URL = `https://api.mistral.ai/v1/agents/${MISTRAL_AGENT_ID}/complete`;
const MISTRAL_CHAT_URL = `https://api.mistral.ai/v1/chat/completions`;


const getPrompt = (destination: string, checkIn: Date | null, checkOut: Date | null): string => {
    const amenityValues = Object.values(Amenity).join(', ');
    const hotelStyleValues = Object.values(HotelStyle).join(', ');

    let dateContext = '';
    if (checkIn && checkOut) {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const checkInStr = checkIn.toLocaleDateString('en-GB', options);
        const checkOutStr = checkOut.toLocaleDateString('en-GB', options);
        dateContext = ` The user is looking to stay from ${checkInStr} to ${checkOutStr}. Provide recommendations and potential special offers relevant to this period.`;
    }
    
    return `
        You are an expert travel API. Your task is to generate a list of hotel options for a trip to ${destination}.
        Use British English.
        You must return ONLY a single valid JSON object. Do not include any text, markdown, or explanations before or after the JSON object.
        The JSON object must have a single key "hotels", which is an array of exactly four distinct, realistic hotel objects.
        ${dateContext}
        Each hotel object in the "hotels" array must have the following structure:
        - name: string (The name of the hotel)
        - tagline: string (A short, catchy tagline)
        - pricePerNight: number (Average price in British pounds, e.g., 150)
        - amenities: Amenity[] (An array of strings from this exact list: [${amenityValues}])
        - rating: number (A rating between 3.5 and 5.0)
        - reviewCount: number (Total number of reviews, e.g., 482)
        - guestHighlight: string (A short, positive quote from a guest)
        - location: string (Brief description of the location)
        - style: HotelStyle (A string from this exact list: [${hotelStyleValues}])
        - specialOffer: string (Optional. A special offer or promotion)
        - isAiSuggested: boolean (Must be true for exactly ONE hotel, and false for the other three)

        IMPORTANT RULE: Do NOT add a 'specialOffer' to the hotel where 'isAiSuggested' is true. You can optionally add a 'specialOffer' to any of the other three hotels.
    `;
};

const parseAndValidateResponse = (jsonText: string): { hotels: Listing[] } => {
    const parsed = JSON.parse(jsonText);
    if (!parsed.hotels || !Array.isArray(parsed.hotels)) {
        throw new Error("Invalid data structure in AI response. The 'hotels' array is missing.");
    }
    return parsed as { hotels: Listing[] };
};

export const generateListings = async (destination: string, checkIn: Date | null, checkOut: Date | null): Promise<{ hotels: Listing[] }> => {
    if (!MISTRAL_API_KEY) {
        throw new Error("Mistral API key is not configured. Please add it as an environment variable for your deployment.");
    }
    if (!MISTRAL_AGENT_ID) {
        throw new Error("Mistral Agent ID is not configured.");
    }
    
    const prompt = getPrompt(destination, checkIn, checkOut);

    // --- Primary Method: Try Mistral Agent API ---
    try {
        const agentResponse = await fetch(MISTRAL_AGENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                "prompt": prompt,
                "response_format": { "type": "json_object" }
            })
        });

        if (agentResponse.ok) {
            const data = await agentResponse.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                throw new Error("Invalid response structure from Mistral Agent API.");
            }
            return parseAndValidateResponse(data.choices[0].message.content);
        }

        if (agentResponse.status !== 404) {
             const errorBody = await agentResponse.text();
             console.error("Mistral Agent API Error Body:", errorBody);
             if (agentResponse.status === 401) {
                 throw new Error(`Mistral Agent API error (401): Unauthorized. Please check your API Key.`);
             }
             throw new Error(`Mistral Agent API error (${agentResponse.status}): Could not fetch data.`);
        }
        
        console.warn("Mistral Agent not found (404). Falling back to Chat Completions API. Please check your Agent ID and API Key permissions on the Mistral platform.");

    } catch (error: any) {
        console.error("Initial attempt to contact Mistral Agent failed, proceeding to fallback:", error.message);
    }
    
    // --- Fallback Method: Use Chat Completions API ---
    console.log("Attempting fallback to Mistral Chat Completions API...");
    try {
         const chatResponse = await fetch(MISTRAL_CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                "model": "mistral-large-latest",
                "messages": [{ "role": "user", "content": prompt }],
                "response_format": { "type": "json_object" }
            })
        });
        
        if (!chatResponse.ok) {
             const errorBody = await chatResponse.text();
             console.error("Mistral Chat API Error Body:", errorBody);
             throw new Error(`Mistral Chat API error (${chatResponse.status}): Fallback failed.`);
        }
        
        const data = await chatResponse.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error("Invalid response structure from Mistral Chat API (fallback).");
        }
        return parseAndValidateResponse(data.choices[0].message.content);

    } catch (error: any) {
        console.error("Error during fallback to Mistral Chat API:", error);
         if (error instanceof SyntaxError) {
             throw new Error("The AI returned an invalid format on fallback. Please try your search again.");
        }
        throw new Error(error.message || "An unknown error occurred while contacting the AI service.");
    }
};