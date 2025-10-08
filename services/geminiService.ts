import { GoogleGenAI, Type } from "@google/genai";
import { Amenity, Listing, HotelStyle } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const amenityValues = Object.values(Amenity);
const hotelStyleValues = Object.values(HotelStyle);

const listingSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'The name of the hotel.' },
        tagline: { type: Type.STRING, description: 'A short, catchy tagline for the accommodation.' },
        pricePerNight: { type: Type.NUMBER, description: 'The average price per night in British pounds (£).' },
        amenities: {
            type: Type.ARRAY,
            description: 'A list of key amenities offered.',
            items: {
                type: Type.STRING,
                enum: amenityValues,
            }
        },
        rating: { type: Type.NUMBER, description: 'The average guest rating out of 5.' },
        reviewCount: { type: Type.INTEGER, description: 'The total number of reviews.' },
        guestHighlight: { type: Type.STRING, description: 'A short, positive quote from a guest review.' },
        location: { type: Type.STRING, description: 'A brief description of the location and proximity to attractions.' },
        style: {
            type: Type.STRING,
            description: "The style or vibe of the hotel.",
            enum: hotelStyleValues,
        },
        specialOffer: { type: Type.STRING, description: 'Any special offer or promotion currently available. Optional.' },
        isAiSuggested: { type: Type.BOOLEAN, description: 'Set to true for exactly one hotel that is the top AI pick.' }
    },
    required: ['name', 'tagline', 'pricePerNight', 'amenities', 'rating', 'reviewCount', 'guestHighlight', 'location', 'style', 'isAiSuggested']
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        hotels: {
            type: Type.ARRAY,
            description: 'A list of four top recommended hotels.',
            items: listingSchema
        },
    },
    required: ['hotels']
};


export const generateListings = async (destination: string, checkIn: Date | null, checkOut: Date | null): Promise<{ hotels: Listing[] }> => {
    
    let dateContext = '';
    if (checkIn && checkOut) {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const checkInStr = checkIn.toLocaleDateString('en-GB', options);
        const checkOutStr = checkOut.toLocaleDateString('en-GB', options);
        dateContext = ` The user is looking to stay from ${checkInStr} to ${checkOutStr}. Provide recommendations and potential special offers relevant to this period.`;
    }
    
    const prompt = `
        Generate a list of hotel options for a trip to ${destination}, in the style of an Airbnb or Agoda listing. Use British English.
        Provide four top-rated, realistic hotels with a variety of vibes, assigning a 'style' to each from the provided list (${hotelStyleValues.join(', ')}).
        ${dateContext}
        For each hotel, provide all the details required by the JSON schema. Prices should be in British Pounds (£). Make the guest highlights sound authentic. Ensure the amenities are chosen from the provided list.
        
        Crucially, designate exactly ONE of the four hotels as the 'AI Suggested' top pick by setting the 'isAiSuggested' property to true for that hotel, and false for all others.

        IMPORTANT: Do NOT add a 'specialOffer' to the hotel where 'isAiSuggested' is true. You can optionally add a compelling 'specialOffer' to any of the other three hotels.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        const parsed = JSON.parse(jsonText);
        // Basic validation
        if (!parsed.hotels) {
            throw new Error("Invalid data structure received from API.");
        }
        return parsed as { hotels: Listing[] };
    } catch (error) {
        console.error("Failed to parse Gemini response:", jsonText);
        throw new Error("Could not understand the response from the AI. Please try again.");
    }
};