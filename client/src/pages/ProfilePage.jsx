import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import toast from 'react-hot-toast';
import axios from 'axios';

const ProfilePage = () => {
  const { authUser, setAuthUser } = useContext(AuthContext);
  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (authUser) {
      setFormData({
        name: typeof authUser.fullName === 'string' ? authUser.fullName : '',
        bio: typeof authUser.bio === 'string' ? authUser.bio : ''
      });
    }
  }, [authUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImg(file);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1. Prepare data
    const updateData = {
      fullName: String(formData.name).trim(),
      bio: String(formData.bio).trim(),
      profilePic: selectedImg ? await convertToBase64(selectedImg) : undefined
    };

    // 2. Debug output
    console.log("Update payload:", {
      ...updateData,
      profilePic: updateData.profilePic ? "BASE64_IMAGE" : null
    });

    // 3. Use Vite env variable
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // 4. API call
    const { data } = await axios.put(
      `${backendUrl}/api/auth/update-profile`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        timeout: 10000 // 10 second timeout
      }
    );

    // 5. Handle success
    if (data.success) {
      toast.success("Profile updated!");
      setAuthUser(data.user);
      navigate('/');
    }

  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      console.error("Server error:", {
        status: error.response.status,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        navigate('/login');
        toast.error("Session expired. Please login again.");
      } else if (error.response.status === 500) {
        toast.error("Server error. Please try again later.");
      }
    } else if (error.request) {
      console.error("Network error:", error.request);
      toast.error("Network error. Check your connection.");
    } else {
      console.error("Error:", error.message);
      toast.error(error.message);
    }
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-4xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-stretch justify-between max-sm:flex-col-reverse rounded-lg overflow-hidden'>
        {/* Form Section */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-[0.6]'>
          <h3 className='text-2xl font-semibold mb-4'>Profile Details</h3>
          
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input 
              onChange={handleImageChange}
              type="file"
              id='avatar'
              accept='.png,.jpg,.jpeg'
              hidden
            />
            <img 
              src={
                selectedImg ? URL.createObjectURL(selectedImg) : 
                (authUser?.profilePic || assets.avatar_icon)
              }
              alt="Profile"
              className='w-16 h-16 rounded-full object-cover border border-gray-500'
            />
            <span className='text-sm text-gray-400 hover:text-gray-300'>
              {selectedImg ? 'Change image' : 'Upload profile image'}
            </span>
          </label>
          
          <div className='flex flex-col gap-1'>
            <label htmlFor="name" className='text-sm text-gray-400'>Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className='p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-violet-500'
              required
            />
          </div>
          
          <div className='flex flex-col gap-1'>
            <label htmlFor="bio" className='text-sm text-gray-400'>Bio</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: String(e.target.value)})}
              className='p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-violet-500 min-h-[100px]'
              maxLength={150}
            />
          </div>
          
          <button
            type="submit"
            className='mt-4 py-2 bg-violet-600 hover:bg-violet-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Preview Section */}
        <div className='flex-[0.4] bg-gradient-to-br from-violet-900/30 to-gray-800/50 flex items-center justify-center p-8 max-sm:hidden'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <img
              src={
                selectedImg ? URL.createObjectURL(selectedImg) :
                (authUser?.profilePic || assets.logo)
              }
              alt="Preview"
              className='w-32 h-32 rounded-full object-cover border-2 border-violet-400/50'
            />
            <h2 className='text-xl font-bold text-gray-200'>
              {formData.name || 'Your Name'}
            </h2>
            <p className='text-gray-400 text-sm max-w-xs'>
              {formData.bio || 'Your bio appears here...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;