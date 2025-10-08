// FIX: Removed circular import of 'Amenity' from './types' which was causing a conflict with the local declaration.
export enum Amenity {
    Wifi = "Wi-Fi",
    Breakfast = "Breakfast",
    Parking = "Parking",
    Pool = "Pool",
    Gym = "Gym",
    PetFriendly = "Pet-friendly",
    AirConditioning = "Air Conditioning",
    Restaurant = "Restaurant",
    Spa = "Spa",
}

export enum HotelStyle {
    Luxury = "Luxury",
    Boutique = "Boutique",
    FamilyFriendly = "Family-Friendly",
    Budget = "Budget",
}

export interface Listing {
    name: string;
    tagline: string;
    pricePerNight: number;
    amenities: Amenity[];
    rating: number;
    reviewCount: number;
    guestHighlight: string;
    location: string;
    style: HotelStyle;
    specialOffer?: string;
    isAiSuggested?: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
}