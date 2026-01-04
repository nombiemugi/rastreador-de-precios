"use client";

import { useState } from 'react';
import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button';

const AddProductForm = ({ user }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSubmit = async (e) =>{};




  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ingresa la URL del producto"
              className="h-12 text-base"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 h-10 sm:h-12 px-8"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Rastrear Producto"
              )}
            </Button>  
            
          </div>
        </form>


        {/* authenthication modal */}







      </>
  )
}

export default AddProductForm