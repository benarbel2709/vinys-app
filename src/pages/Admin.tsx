import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Users, Activity, TrendingUp, BarChart3, Loader2, ShieldAlert } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  usersWithPlans: number;
  totalEvents: number;
  recentSignups: Array<{ id: string; display_name: string | null; created_at: string }>;
  eventBreakdown: Array<{ event_name: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}

export default function Admin() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdmin = async () => {
      const { data } = await (supabase.rpc as any)("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
      if (data) fetchStats();
      else setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      // Fetch profiles (admin policy allows reading all)
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false });

      // Fetch app data to count plans
      const { data: appData } = await supabase.from("user_app_data").select("id, current_plan");

      // Fetch analytics events
      const { data: events } = await (supabase.from("analytics_events") as any).select("id, event_name, created_at").order("created_at", { ascending: false }).limit(1000);

      const usersWithPlans = appData?.filter(d => d.current_plan !== null).length || 0;

      // Event breakdown
      const eventCounts: Record<string, number> = {};
      events?.forEach(e => {
        eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
      });
      const eventBreakdown = Object.entries(eventCounts)
        .map(([event_name, count]) => ({ event_name, count }))
        .sort((a, b) => b.count - a.count);

      // Daily activity (last 14 days)
      const dailyCounts: Record<string, number> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyCounts[d.toISOString().split("T")[0]] = 0;
      }
      events?.forEach(e => {
        const day = e.created_at.split("T")[0];
        if (dailyCounts[day] !== undefined) dailyCounts[day]++;
      });
      const dailyActivity = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

      setStats({
        totalUsers: profiles?.length || 0,
        usersWithPlans,
        totalEvents: events?.length || 0,
        recentSignups: (profiles || []).slice(0, 10),
        eventBreakdown,
        dailyActivity,
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-24 space-y-4">
          <ShieldAlert size={40} className="mx-auto text-destructive/60" />
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground text-sm">You don't have admin privileges.</p>
          <Button variant="outline-calm" onClick={() => navigate("/")}>Back to home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="vinys-container max-w-4xl py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">User engagement and analytics overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} />
          <StatCard icon={Activity} label="With Plans" value={stats?.usersWithPlans || 0} />
          <StatCard icon={BarChart3} label="Total Events" value={stats?.totalEvents || 0} />
          <StatCard icon={TrendingUp} label="Conversion" value={stats && stats.totalUsers > 0 ? `${Math.round((stats.usersWithPlans / stats.totalUsers) * 100)}%` : "—"} />
        </div>

        {/* Daily activity */}
        <div className="card-premium p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Daily Activity (14 days)</h2>
          <div className="flex items-end gap-1 h-24">
            {stats?.dailyActivity.map((d) => {
              const max = Math.max(...(stats.dailyActivity.map(x => x.count)), 1);
              const height = Math.max((d.count / max) * 100, 4);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count} events`}>
                  <div
                    className="w-full rounded-sm bg-accent/60 transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{stats?.dailyActivity[0]?.date.slice(5)}</span>
            <span>{stats?.dailyActivity[stats.dailyActivity.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Event breakdown */}
        <div className="card-premium p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Event Breakdown</h2>
          {stats?.eventBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded yet. Events will appear here as users interact with the app.</p>
          ) : (
            <div className="space-y-2">
              {stats?.eventBreakdown.map((e) => (
                <div key={e.event_name} className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{e.event_name.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground tabular-nums">{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div className="card-premium p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Signups</h2>
          {stats?.recentSignups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentSignups.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{u.display_name || "Anonymous"}</span>
                  <span className="text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="card-premium p-4 space-y-2">
      <Icon size={18} className="text-accent" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
