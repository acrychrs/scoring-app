'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [totalGames, setTotalGames] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async () => {
    // Ambil total game yang ada untuk hitungan "X dari Y"
    const { count } = await supabase.from('games').select('*', { count: 'exact', head: true })
    setTotalGames(count || 0)

    const { data } = await supabase.from('teams').select(`id, team_name, scores (score)`)
    if (data) {
      const formatted = data.map((team: any) => ({
        name: team.team_name,
        total: team.scores.reduce((acc: number, curr: any) => acc + curr.score, 0),
        gamesPlayed: team.scores.length
      })).sort((a, b) => b.total - a.total)
      setLeaderboard(formatted)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeaderboard()
    const channel = supabase.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => fetchLeaderboard()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLeaderboard])

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 bg-white">RECALCULATING...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 max-w-2xl mx-auto">
      <header className="text-center mb-12 animate-fade-up">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-indigo-600">Leaderboard</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Live Progres Peserta</p>
      </header>

      <div className="space-y-4">
        {leaderboard.map((team, i) => (
          <div key={team.name} className="bg-white p-5 rounded-[2rem] flex justify-between items-center shadow-sm border border-white hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${i === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : 'bg-slate-100 text-slate-400'}`}>
                {i + 1}
              </div>
              <div>
                <span className="text-lg font-black text-slate-800 uppercase italic leading-none block">{team.name}</span>
                {/* INI FITUR X GAME DIMAINKAN */}
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 block">
                  {team.gamesPlayed} / {totalGames} Games Completed
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-indigo-600 leading-none">{team.total}</span>
              <p className="text-[9px] font-black text-slate-400 uppercase">Points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}