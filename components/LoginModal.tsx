import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { GoogleIcon, MailIcon, LockIcon, CameraIcon } from '../constants';

// --- Helper Types ---
type AuthView = 'signIn' | 'signUp' | 'postSignUp';
type AuthTab = 'email' | 'google';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView: 'signIn' | 'signUp';
}

// --- Helper Functions ---
const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return await res.blob();
};


// --- Component ---
const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialView }) => {
    // --- State Management ---
    const [activeTab, setActiveTab] = useState<AuthTab>('google');
    const [view, setView] = useState<AuthView>(initialView);
    
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Effect to reset state when modal is opened or view changes
    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setActiveTab(initialView === 'signUp' ? 'email' : 'google');
            resetFormFields();
        }
    }, [isOpen, initialView]);

    if (!isOpen) return null;

    const resetFormFields = () => {
        setName(''); setEmail(''); setPassword('');
        setProfileImage(null); setError(null); setSuccessMessage(null);
    };

    const handleTabChange = (tab: AuthTab) => {
        setActiveTab(tab);
        resetFormFields();
    };
    
    const handleViewChange = (newView: AuthView) => {
        setView(newView);
        resetFormFields();
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    // --- Authentication Logic ---

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        await supabase.auth.signInWithOAuth({ provider: 'google' });
        setIsLoading(false); // The modal will close via the onAuthStateChange listener
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        let avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`;

        // Step 1: Handle profile image upload if provided
        if (profileImage) {
            try {
                const blob = await dataUrlToBlob(profileImage);
                const fileExt = blob.type.split('/')[1];
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, blob, { contentType: blob.type });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                avatarUrl = publicUrl;
            } catch (uploadError: any) {
                 setError(`Failed to upload avatar: ${uploadError.message}`);
                 setIsLoading(false);
                 return;
            }
        }

        // Step 2: Sign up the user with their details
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    avatar_url: avatarUrl,
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
        } else {
            setSuccessMessage("Success! Please check your email for a verification link.");
            setView('postSignUp');
        }

        setIsLoading(false);
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        }
        // On success, the onAuthStateChange listener in App.tsx will handle closing the modal.
        
        setIsLoading(false);
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (view === 'postSignUp') {
            return (
                 <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mt-4">Check your inbox!</h2>
                    <p className="text-sm text-gray-500 mt-2">{successMessage}</p>
                    <button onClick={onClose} className="mt-6 px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors">
                        Close
                    </button>
                </div>
            )
        }

        return (
             <div className="p-6 relative">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{view === 'signIn' ? 'Sign in to AI Stays' : 'Create an Account'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                 <div className="flex border-b border-gray-200 mb-4">
                    <button onClick={() => handleTabChange('google')} className={`flex-1 py-2 text-sm font-semibold text-center transition-colors ${activeTab === 'google' ? 'border-b-2 border-rose-500 text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}>
                        Sign in with Google
                    </button>
                    <button onClick={() => handleTabChange('email')} className={`flex-1 py-2 text-sm font-semibold text-center transition-colors ${activeTab === 'email' ? 'border-b-2 border-rose-500 text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}>
                       {view === 'signIn' ? 'Sign in with Email' : 'Sign up with Email'}
                    </button>
                </div>

                {activeTab === 'google' && (
                    <div className="space-y-3">
                         <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-rose-400 cursor-pointer transition-all duration-200">
                            <GoogleIcon />
                            <span className="font-semibold text-gray-700">Continue with Google</span>
                        </button>
                    </div>
                )}
                
                {activeTab === 'email' && (
                    <form onSubmit={view === 'signIn' ? handleSignIn : handleSignUp} className="space-y-4">
                        {view === 'signUp' && (
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="sr-only"/>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-rose-400 transition-colors">
                                        {profileImage ? <img src={profileImage} alt="Preview" className="w-full h-full rounded-full object-cover" /> : <CameraIcon className="w-8 h-8 text-gray-400" />}
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-700 sr-only">Name</label>
                                    <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500" />
                                    <p className="text-xs text-gray-400 mt-1">Profile picture is optional.</p>
                                </div>
                            </div>
                        )}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MailIcon />
                            </div>
                            <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500" />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockIcon />
                            </div>
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500" />
                        </div>

                        {error && <p className="text-xs text-center text-red-500">{error}</p>}

                        <button type="submit" className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-all duration-300">
                            {view === 'signIn' ? 'Sign In' : 'Continue'}
                        </button>

                        <div className="text-center">
                            <button type="button" onClick={() => handleViewChange(view === 'signIn' ? 'signUp' : 'signIn')} className="text-sm text-rose-500 hover:underline font-medium">
                                {view === 'signIn' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all" onClick={e => e.stopPropagation()}>
                {isLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                    </div>
                )}
                {renderContent()}
            </div>
        </div>
    );
};

export default LoginModal;