"use client"

import { useState } from "react"
import Header from "@/components/header"
import Hero from "@/components/hero"
import MenuSection from "@/components/menu-section"
import EventsSection from "@/components/events-section"
import BranchesSection from "@/components/branches-section"
import ContactSection from "@/components/contact-section"
import CartDrawer from "@/components/cart-drawer"
import AmbientBackground from "@/components/ambient-background"

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <main className="bg-royal-red-dark relative min-h-screen">
      <AmbientBackground />
      <Header onCartOpen={() => setCartOpen(true)} />
      <Hero />
      <MenuSection />
      <EventsSection />
      <BranchesSection />
      <ContactSection />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  )
}
