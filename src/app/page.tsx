import { DatabaseMigration } from '@/components/database-migration'

export default function Home() {
  return (
    <main className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Supabase to Appwrite Migration Tool
          </h1>
          <p className="text-gray-600">
            Easily migrate your data from Supabase to Appwrite with just a few clicks
          </p>
        </div>
        
        <DatabaseMigration />
      </div>
    </main>
  )
}