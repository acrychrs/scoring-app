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

  // FUNGSI HAPUS EVENT
  const deleteEvent = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation() // Biar gak ke-trigger navigasi ke detail event
    
    const confirmFirst = confirm(`Yakin mau hapus event "${name}"?`)
    if (confirmFirst) {
      const confirmSecond = confirm(`PERINGATAN: Semua data tim dan skor di dalam event ini akan HILANG PERMANEN. Lanjutkan?`)
      if (confirmSecond) {
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (error) alert("Gagal hapus: " + error.message)
        else fetchEvents()
      }
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-black text-indigo-600">
      LOADING DASHBOARD...
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
      <section className="bg-white p-8 rounded-[2.5rem] mb-16 shadow-2xl shadow-indigo-100 border border-slate-100 animate-fade-up">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1 italic">Create New Event</h2>
        <div className="flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="Event Name (ex: Air Biru Bandung)" 
            className="bg-slate-50 p-5 rounded-2xl outline-none focus:ring-4 ring-indigo-50 font-bold text-lg transition-all border border-slate-100"
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
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-4 italic">Active Events</h3>
        
        {events.map((event) => (
          <div 
            key={event.id} 
            onClick={() => window.location.href = `/admin/${event.id}`}
            className="group bg-white p-6 rounded-[2rem] flex justify-between items-center hover:border-indigo-500 transition-all cursor-pointer shadow-sm border border-slate-100 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Live Event</span>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight">
                {event.name}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              {/* TOMBOL HAPUS */}
              <button 
                onClick={(e) => deleteEvent(e, event.id, event.name)}
                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Hapus Event"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>

              {/* IKON PANAH */}
              <div className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-20 border-4 border-dashed border-slate-100 rounded-[3rem]">
            <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No Events Found</p>
          </div>
        )}
      </section>

      <footer className="mt-24 text-center opacity-20 font-black text-[10px] tracking-[0.5em] uppercase">
        Admin Dashboard v1.1
      </footer>
    </div>
  )
}