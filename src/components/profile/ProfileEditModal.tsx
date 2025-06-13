import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { UserMetadata } from '../../types';
import { X, Save, Image as ImageIcon, User as UserIcon, Edit2, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2, ease: "easeInOut" } },
};

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile, uploadAvatar } = useStore();
  const [formData, setFormData] = useState<Partial<UserMetadata>>({
    full_name: '',
    avatar_url: '',
    bio: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user?.user_metadata) {
      setFormData({
        full_name: user.user_metadata.full_name || user.user_metadata.name || '',
        avatar_url: user.user_metadata.avatar_url || '',
        bio: user.user_metadata.bio || '',
      });
      setSelectedFile(null);
      setPreviewUrl(user.user_metadata.avatar_url || null);
      setError(null);
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB를 초과할 수 없습니다.');
        if(fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setError(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({...prev, avatar_url: ''}));
    } else {
      setSelectedFile(null);
      setPreviewUrl(user?.user_metadata?.avatar_url || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      let newAvatarUrl = formData.avatar_url;

      if (selectedFile) {
        if (!uploadAvatar) {
            throw new Error("uploadAvatar function is not available in the store.");
        }
        const uploadedUrl = await uploadAvatar(selectedFile, user.id);
        newAvatarUrl = uploadedUrl;
      }

      const dataToUpdate: Partial<UserMetadata> = {};
      const currentFullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const currentAvatarUrl = user.user_metadata?.avatar_url || '';
      const currentBio = user.user_metadata?.bio || '';

      const newFullName = formData.full_name?.trim();
      const newBio = formData.bio?.trim();

      if (newFullName !== undefined && newFullName !== currentFullName) {
        dataToUpdate.full_name = newFullName === '' ? undefined : newFullName;
      }
      if (newAvatarUrl !== undefined && newAvatarUrl !== currentAvatarUrl) {
        dataToUpdate.avatar_url = newAvatarUrl === '' ? undefined : newAvatarUrl;
      }
      if (newBio !== undefined && newBio !== currentBio) {
        dataToUpdate.bio = newBio === '' ? undefined : newBio;
      }
      
      if (Object.keys(dataToUpdate).length === 0 && !selectedFile) {
        onClose();
        return;
      }

      await updateUserProfile(user.id, dataToUpdate);
      onClose();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={onClose}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Edit2 size={22} className="mr-2 text-primary-500"/>
                  프로필 수정
                </h3>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  aria-label="닫기"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
                
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    <UserIcon size={16} className="inline mr-1.5 align-text-bottom"/>이름 (닉네임)
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900 placeholder-gray-400"
                    placeholder="표시될 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ImageIcon size={16} className="inline mr-1.5 align-text-bottom"/>프로필 사진
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {previewUrl ? (
                        <img className="h-20 w-20 rounded-full object-cover" src={previewUrl} alt="프로필 미리보기" />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserIcon size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()} 
                      className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <UploadCloud size={16} className="inline mr-1.5 align-text-bottom" />
                      <span>사진 변경</span>
                      <input 
                        ref={fileInputRef} 
                        id="avatar_file" 
                        name="avatar_file" 
                        type="file" 
                        className="sr-only" 
                        accept="image/png, image/jpeg, image/gif" 
                        onChange={handleFileChange} 
                      />
                    </button>
                    {selectedFile && (
                        <button 
                            type="button" 
                            onClick={() => { 
                                setSelectedFile(null); 
                                setPreviewUrl(user?.user_metadata?.avatar_url || null); 
                                if(fileInputRef.current) fileInputRef.current.value = '';
                            }} 
                            className="text-xs text-gray-500 hover:text-red-600"
                        >
                            선택 취소
                        </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF 파일을 최대 5MB까지 업로드할 수 있습니다.
                  </p>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    <UserIcon size={16} className="inline mr-1.5 align-text-bottom"/>자기소개 (선택)
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={3}
                    value={formData.bio || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900 placeholder-gray-400"
                    placeholder="간단한 자기소개를 입력하세요 (최대 200자)"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-4 py-2 text-sm flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-1.5"/> 저장
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileEditModal; 