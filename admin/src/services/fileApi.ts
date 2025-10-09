import { apiCall } from './api'

export interface UploadChunkRequest {
  filename: string
  chunkIndex: number
  totalChunks: number
  file: File
}

export interface FileInfo {
  id: string
  filename: string
  size: number
  uploadedAt: string
  status: 'uploading' | 'completed' | 'failed'
  progress?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const fileApi = {
  // Upload file chunk
  uploadChunk: async (request: UploadChunkRequest) => {
    const formData = new FormData()
    formData.append('file', request.file)
    formData.append('filename', request.filename)
    formData.append('chunkIndex', request.chunkIndex.toString())
    formData.append('totalChunks', request.totalChunks.toString())

    return await apiCall<{
      success: boolean
      message: string
      isComplete?: boolean
      jobId?: string
    }>({
      method: 'POST',
      url: '/files/upload-chunk',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // List files
  listFiles: async (page: number = 1, limit: number = 10) => {
    return await apiCall<PaginatedResponse<FileInfo>>({
      method: 'GET',
      url: '/files',
      params: { page, limit },
    })
  },

  // Helper function to upload large files in chunks
  uploadFileInChunks: async (
    file: File,
    chunkSize: number = 1024 * 1024, // 1MB chunks
    onProgress?: (progress: number) => void
  ) => {
    const totalChunks = Math.ceil(file.size / chunkSize)
    const filename = file.name

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const chunkFile = new File([chunk], filename)

      const result = await fileApi.uploadChunk({
        filename,
        chunkIndex,
        totalChunks,
        file: chunkFile,
      })

      if (!result.success) {
        throw new Error(result.error || `Failed to upload chunk ${chunkIndex}`)
      }

      // Update progress
      const progress = ((chunkIndex + 1) / totalChunks) * 100
      onProgress?.(progress)

      // If this is the last chunk and upload is complete
      if (result.data?.isComplete) {
        return result
      }
    }

    return { success: true, data: { message: 'File uploaded successfully' } }
  },
}
