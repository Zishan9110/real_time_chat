import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
// import { import.meta.env } from 'vite';

// Get environment variables
const API_URL = import.meta.env.VITE_BACKEND_URL;

const LoginPage = () => {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        bio: ''
    });
    const [isSignupStep2, setIsSignupStep2] = useState(false);
    
    const { authUser, login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (authUser) {
            navigate('/');
        }
    }, [authUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (mode === 'signup' && !isSignupStep2) {
            if (!formData.email || !formData.password || !formData.fullName) {
                toast.error('Please fill all fields');
                return;
            }
            setIsSignupStep2(true);
            return;
        }

        const credentials = mode === 'signup' 
            ? formData 
            : { email: formData.email, password: formData.password };

        const success = await login(mode, credentials);
        if (success) {
            setFormData({
                email: '',
                password: '',
                fullName: '',
                bio: ''
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setIsSignupStep2(false);
        setFormData({
            email: '',
            password: '',
            fullName: '',
            bio: ''
        });
    };

    return (
        <div className='min-h-screen bg-center bg-cover flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
            <img src={assets.logo_big} alt="" className='w-[min(30vw, 250px)]' />

            <form onSubmit={handleSubmit} className='border-2 bg-white/8 border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
                <h2 className='font-medium text-2xl text-white'>
                    {mode === 'signup' ? (isSignupStep2 ? 'Complete Signup' : 'Sign Up') : 'Login'}
                </h2>

                {mode === 'signup' && !isSignupStep2 && (
                    <input
                        name="fullName"
                        type="text"
                        placeholder='Full Name'
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className='p-2 border border-gray-500 rounded-md focus:outline-none placeholder-gray-300 text-white bg-transparent'
                    />
                )}

                {!isSignupStep2 && (
                    <>
                        <input
                            name="email"
                            type="email"
                            placeholder='Email'
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className='p-2 border border-gray-500 rounded-md focus:outline-none placeholder-gray-300 text-white bg-transparent'
                        />
                        <input
                            name="password"
                            type="password"
                            placeholder='Password'
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className='p-2 border border-gray-500 rounded-md focus:outline-none placeholder-gray-300 text-white bg-transparent'
                        />
                    </>
                )}

                {mode === 'signup' && isSignupStep2 && (
                    <textarea
                        name="bio"
                        placeholder='Bio'
                        value={formData.bio}
                        onChange={handleChange}
                        required
                        className='p-2 border border-gray-500 rounded-md focus:outline-none placeholder-gray-300 text-white bg-transparent'
                        rows={4}
                    />
                )}

                <button type="submit" className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
                    {mode === 'signup' ? (isSignupStep2 ? 'Complete Signup' : 'Continue') : 'Login'}
                </button>

                <p className='text-sm text-gray-600'>
                    {mode === 'login' ? (
                        <>Don't have an account? <span onClick={toggleMode} className='font-medium text-violet-500 cursor-pointer'>Sign up</span></>
                    ) : (
                        <>Already have an account? <span onClick={toggleMode} className='font-medium text-violet-500 cursor-pointer'>Login</span></>
                    )}
                </p>
            </form>
        </div>
    );
};

export default LoginPage;