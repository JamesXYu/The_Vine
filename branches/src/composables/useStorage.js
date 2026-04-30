import { ref } from 'vue'
import { supabase } from '../supabase'

export function useStorage() {
  const uploadFile = async (bucket, filePath, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) throw error
    return data
  }

  const downloadFile = async (bucket, filePath) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)

    if (error) throw error
    return data
  }

  const getPublicUrl = (bucket, filePath) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  const deleteFile = async (bucket, filePath) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error
  }

  return {
    uploadFile,
    downloadFile,
    getPublicUrl,
    deleteFile,
  }
}
