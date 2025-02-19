import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Collection } from '@/lib/types';

interface CollectionFormProps {
  collections: Collection[];
  onChange: (collections: Collection[]) => void;
}

export function CollectionForm({ collections, onChange }: CollectionFormProps) {
  const addCollection = () => {
    onChange([...collections, {
      supabaseTable: '',
      appwriteDatabaseId: '',
      appwriteCollectionId: ''
    }]);
  };

  const removeCollection = (index: number) => {
    onChange(collections.filter((_, i) => i !== index));
  };

  const updateCollection = (index: number, field: keyof Collection, value: string) => {
    const newCollections = [...collections];
    newCollections[index] = {
      ...newCollections[index],
      [field]: value
    };
    onChange(newCollections);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Collections to Migrate</h2>
        <Button
          onClick={addCollection}
          variant="secondary"
        >
          Add Collection
        </Button>
      </div>

      {collections.map((collection, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              type="text"
              placeholder="Supabase Table"
              value={collection.supabaseTable}
              onChange={(e) => updateCollection(index, 'supabaseTable', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Appwrite Database ID"
              value={collection.appwriteDatabaseId}
              onChange={(e) => updateCollection(index, 'appwriteDatabaseId', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Appwrite Collection ID"
              value={collection.appwriteCollectionId}
              onChange={(e) => updateCollection(index, 'appwriteCollectionId', e.target.value)}
            />
          </div>
          {collections.length > 1 && (
            <Button
              onClick={() => removeCollection(index)}
              variant="destructive"
              className="mt-2"
            >
              Remove
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}