import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await fetch('/admin/stats.json', { credentials:'include' })
        if (!r.ok) throw new Error('HTTP '+r.status)
        const d = await r.json()
        if (!cancelled) setStats(d)
      } catch (e) {
        if (!cancelled) setError('Không thể tải thống kê')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <AdminLayout title="Bảng điều khiển">
      {loading && <div>Đang tải...</div>}
      {error && <div style={{color:'#ff9b9b'}}>{error}</div>}
      {stats && (
        <div style={{display:'grid',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Kpi label="Sản phẩm" value={stats.products} link="/admin/products" />
            <Kpi label="Người dùng" value={stats.users} link="/admin/users" />
            <Kpi label="Đơn hàng" value={stats.orders} link="/admin/orders" />
            <Kpi label="Doanh thu" value={fmtPrice(stats.revenue_total)} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
            <div className="action-card" style={{padding:16}}>
              <h3 style={{margin:'0 0 8px'}}>Trạng thái đơn</h3>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr><th style={{textAlign:'left',padding:4}}>Trạng thái</th><th style={{textAlign:'right',padding:4}}>SL</th></tr></thead>
                <tbody>
                  {Object.keys(stats.status_counts).map(s => (
                    <tr key={s}>
                      <td style={{padding:4}}>{s}</td>
                      <td style={{padding:4,textAlign:'right'}}>{stats.status_counts[s]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="action-card" style={{padding:16}}>
              <h3 style={{margin:'0 0 8px'}}>Top sản phẩm</h3>
              {!stats.top_products.length && <div className="muted">Chưa có dữ liệu.</div>}
              {!!stats.top_products.length && (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr><th style={{textAlign:'left',padding:4}}>Tên</th><th style={{textAlign:'right',padding:4}}>SL</th></tr></thead>
                  <tbody>
                    {stats.top_products.map(tp => (
                      <tr key={tp.id}><td style={{padding:4}}>{tp.name}</td><td style={{padding:4,textAlign:'right'}}>{tp.qty}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="action-card" style={{padding:16}}>
              <h3 style={{margin:'0 0 8px'}}>Tồn kho thấp (&lt;5)</h3>
              {!stats.low_stock.length && <div className="muted">Không có sản phẩm sắp hết.</div>}
              {!!stats.low_stock.length && (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr><th style={{textAlign:'left',padding:4}}>Tên</th><th style={{textAlign:'right',padding:4}}>Tồn</th></tr></thead>
                  <tbody>
                    {stats.low_stock.map(ls => (
                      <tr key={ls.id}><td style={{padding:4}}>{ls.name}</td><td style={{padding:4,textAlign:'right'}}>{ls.stock}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="admin-card span-full" style={{padding:24,gap:24}}>
            <h3 style={{margin:'0 0 4px'}}>Doanh thu & đơn theo ngày</h3>
            <BigChart data={stats.daily||[]} />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function fmtPrice(usd){
  const rate = 25000; // fallback; server returns VND already but convert for display
  const n = Number(usd||0)
  const vnd = Math.round(n*rate).toLocaleString('vi-VN')+'₫'
  return vnd + ' (≈$' + n.toFixed(2) + ')'
}

function Kpi({ label, value, link }){
  const content = (
    <div style={{background:'linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))',border:'1px solid rgba(255,255,255,0.05)',padding:16,borderRadius:10,display:'flex',flexDirection:'column',gap:6}}>
      <div style={{fontSize:13,color:'var(--muted)'}}>{label}</div>
      <div style={{fontSize:24,fontWeight:700}}>{value}</div>
    </div>
  )
  if (link) return <a href={link} style={{textDecoration:'none',color:'inherit'}}>{content}</a>
  return content
}

function MiniChart({ data, kind }){
  if (!data.length) return <div className="muted">Không có dữ liệu.</div>
  const values = data.map(d => kind==='revenue'? Number(d.revenue)||0 : Number(d.orders)||0)
  const max = Math.max(...values,1)
  const points = values.map((v,i)=> ({ x:i/(values.length-1), y: v/max }))
  return (
    <svg viewBox="0 0 100 30" style={{width:'100%',height:60,marginBottom:8}}>
      <polyline fill="none" stroke={kind==='revenue'? '#ff6a00':'#00b4d8'} strokeWidth="1.5" points={points.map(p=> `${p.x*100},${30 - p.y*26}`).join(' ')} />
      {points.map((p,i)=>(<circle key={i} cx={p.x*100} cy={30 - p.y*26} r={1.6} fill={kind==='revenue'? '#ff6a00':'#00b4d8'} />))}
      {points.map((p,i)=>(<text key={'t'+i} x={p.x*100} y={29} fontSize="3" textAnchor="middle" fill="#94a3b8">{String(data[i].day).slice(5)}</text>))}
    </svg>
  )
}

function BigChart({ data }){
  if (!data.length) return <div className="muted">Không có dữ liệu.</div>
  const rev = data.map(d => Number(d.revenue)||0)
  const ord = data.map(d => Number(d.orders)||0)
  const max = Math.max(...rev, ...ord, 1)
  const revPoints = rev.map((v,i)=> ({ x:i/(rev.length-1), y: v/max }))
  const ordPoints = ord.map((v,i)=> ({ x:i/(ord.length-1), y: v/max }))
  return (
    <svg viewBox="0 0 100 60" className="admin-chart-large" style={{width:'100%',height:240}}>
      <polyline fill="none" stroke="#ff6a00" strokeWidth="1.8" points={revPoints.map(p=> `${p.x*100},${60 - p.y*52}`).join(' ')} />
      {revPoints.map((p,i)=>(<circle key={'r'+i} cx={p.x*100} cy={60 - p.y*52} r={2} fill="#ff6a00" />))}
      <polyline fill="none" stroke="#00b4d8" strokeWidth="1.8" points={ordPoints.map(p=> `${p.x*100},${60 - p.y*52}`).join(' ')} />
      {ordPoints.map((p,i)=>(<circle key={'o'+i} cx={p.x*100} cy={60 - p.y*52} r={2} fill="#00b4d8" />))}
      {data.map((d,i)=>(<text key={'t'+i} x={revPoints[i].x*100} y={58} fontSize="4" textAnchor="middle" fill="#64748b">{String(d.day).slice(5)}</text>))}
    </svg>
  )
}
