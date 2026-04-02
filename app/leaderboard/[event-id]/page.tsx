'use client' // WAJIB karena menggunakan useEffect dan State

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function LeaderboardPage({ params }: { params: { event_id: string } }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  // 1. Fungsi untuk ambil data terbaru dari Database
  const fetchLatestLeaderboard = async () => {
    // Kita panggil data tim dan jumlahkan skornya
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id, 
        team_name, 
        scores (score)
      `)
      .eq('event_id', params.event_id)

    if (data) {
      // Hitung total skor tiap tim secara manual di client
      const formatted = data.map(team => ({
        name: team.team_name,
        total: team.scores.reduce((acc: number, curr: any) => acc + curr.score, 0)
      })).sort((a, b) => b.total - a.total) // Urutkan dari yang terbesar
      
      setLeaderboard(formatted)
    }
  }

  // 2. Pasang Realtime Listener di useEffect
  useEffect(() => {
    // Jalankan fetch pertama kali saat halaman dibuka
    fetchLatestLeaderboard()

    // --- KODE YANG KAMU TANYAKAN DI SINI ---
    const channel = supabase
      .channel('realtime-scores') // Nama bebas
      .on(
        'postgres_changes', 
        { 
          event: '*', // Monitor Insert, Update, dan Delete
          schema: 'public', 
          table: 'scores' 
        }, 
        (payload) => {
          console.log('Ada skor baru masuk!', payload)
          fetchLatestLeaderboard() // Panggil fungsi refresh data
        }
      )
      .subscribe()
    // ---------------------------------------

    // Bersihkan listener saat user pindah halaman
    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.event_id])

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">🏆 LIVE LEADERBOARD</h1>
      <div className="space-y-2">
        {leaderboard.map((team, index) => (
          <div key={team.name} className="flex justify-between p-4 bg-white shadow rounded-lg border">
            <span className="font-medium">{index + 1}. {team.name}</span>
            <span className="font-bold text-blue-600">{team.total} Pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}