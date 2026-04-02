'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([])
  const [newEvent, setNewEvent] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const addEvent = async () => {
    if (!newEvent) return
    const { error } = await supabase.from('events').insert([{ name: newEvent }])
    if (error) alert(error.message)
    else {
      setNewEvent('')
      fetchEvents()
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto bg-white text-slate-900">
      
      {/* HEADER */}
      <header className="mb-12 animate-fade-up">
        <h1 className="text-5xl font-black tracking-tighter italic uppercase leading-none">
          Admin <span className="text-indigo-600">Panel</span>
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
          Event Management System
        </p>
      </header>

      {/* CREATE EVENT CARD */}
      <section className="glass p-8 rounded-[2.5rem] mb-16 shadow-2xl shadow-indigo-100 border border-white animate-fade-up">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Create New Event</h2>
        <div className="flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="Event Name (ex: Air Biru Bandung)" 
            className="bg-slate-100 p-5 rounded-2xl outline-none focus:ring-4 ring-indigo-100 font-bold text-lg transition-all border-none"
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
          />
          <button 
            onClick={addEvent}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all uppercase tracking-widest text-sm"
          >
            Create Event ➔
          </button>
        </div>
      </section>

      {/* LIST EVENTS */}
      <section className="space-y-4 animate-fade-up">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-4 italic">Your Active Events</h3>
        
        {events.map((event) => (
          <div 
            key={event.id} 
            onClick={() => window.location.href = `/admin/${event.id}`}
            className="group glass p-6 rounded-[2rem] flex justify-between items-center hover:border-indigo-500 transition-all cursor-pointer shadow-sm border border-transparent hover:shadow-xl active:scale-95"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Live Event</span>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight">
                {event.name}
              </h4>
            </div>

            {/* IKON PANAH (MENGGANTIKAN KOTAK KOSONG) */}
            <div className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-[-45deg] transition-all duration-300">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-6 h-6"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-20 border-4 border-dashed border-slate-100 rounded-[3rem]">
            <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No Events Yet</p>
          </div>
        )}
      </section>

      <footer className="mt-24 text-center opacity-20 font-black text-[10px] tracking-[0.5em] uppercase">
        Powering Your Competition
      </footer>
    </div>
  )
}