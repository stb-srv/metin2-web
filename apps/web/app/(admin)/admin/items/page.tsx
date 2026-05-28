"use client"

import React, { useState } from "react"
import { ItemsList } from "./ItemsList"
import CategoriesTab from "./components/CategoriesTab"
import ShopItemsTab from "./components/ShopItemsTab"
import { Button } from "@/components/ui/button"
import { Plus, Database, Tag, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default function AdminItemsPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "categories" | "shop-items">("templates")

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/10 pb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Items & Shop</h1>
          <p className="text-text-muted mt-1">
            Verwalte globale Item-Vorlagen, Shop-Kategorien und Items für den Ingame-Web-Itemshop.
          </p>
        </div>
        
        {activeTab === "templates" && (
          <Link href="/admin/items/new">
            <Button className="bg-primary hover:bg-primary/95 text-bg font-display uppercase tracking-wider text-xs hover:shadow-[0_0_12px_var(--color-glow)]">
              <Plus className="w-4 h-4 mr-2" /> Neue Vorlage anlegen
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-border/10 pb-px">
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-display text-xs tracking-wider uppercase transition-all ${
            activeTab === "templates"
              ? "border-primary text-primary font-bold shadow-[0_2px_8px_var(--color-glow)]"
              : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Item-Vorlagen
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-display text-xs tracking-wider uppercase transition-all ${
            activeTab === "categories"
              ? "border-primary text-primary font-bold shadow-[0_2px_8px_var(--color-glow)]"
              : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Shop-Kategorien
        </button>

        <button
          onClick={() => setActiveTab("shop-items")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-display text-xs tracking-wider uppercase transition-all ${
            activeTab === "shop-items"
              ? "border-primary text-primary font-bold shadow-[0_2px_8px_var(--color-glow)]"
              : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Shop-Items
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "templates" && <ItemsList />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "shop-items" && <ShopItemsTab />}
      </div>

    </div>
  )
}
