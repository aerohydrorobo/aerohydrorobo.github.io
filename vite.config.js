import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: '.' // এর ফলে বিল্ড ফাইলগুলো dist ফোল্ডারে না গিয়ে সরাসরি বাইরে তৈরি হবে
  }
})