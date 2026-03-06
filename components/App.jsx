'use client'
import { useState, useEffect, useCallback } from 'react'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = d => { if (!d) return '—'; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}` }
const fmtMoney = v => 'R$ ' + parseFloat(v||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })
const currentMonth = () => new Date().toISOString().slice(0, 7)
const saldoPendente = s => Math.max(0, (parseFloat(s.valor)||0) - (parseFloat(s.sinal)||0) - (parseFloat(s.valorPago)||0))

const MARCENEIROS = ['Maicon', 'Victor', 'Carlos', 'Daniel']
const STATUS_CFG = {
  orcamento: { label:'Orçamento',   color:'#5dade2', bg:'rgba(93,173,226,.15)',  border:'rgba(93,173,226,.3)'  },
  producao:  { label:'Em Produção', color:'#f0c040', bg:'rgba(240,192,64,.15)',  border:'rgba(240,192,64,.3)'  },
  entregue:  { label:'Entregue',    color:'#5db872', bg:'rgba(93,184,114,.15)',  border:'rgba(93,184,114,.3)'  },
  cancelado: { label:'Cancelado',   color:'#e05545', bg:'rgba(224,85,69,.15)',   border:'rgba(224,85,69,.3)'   },
}
const ORC_STATUS = {
  enviado:    { label:'Enviado',    color:'#5dade2' },
  aprovado:   { label:'Aprovado ✓', color:'#5db872' },
  recusado:   { label:'Recusado',   color:'#e05545' },
  aguardando: { label:'Aguardando', color:'#f0c040' },
}
const COMP_TIPOS = {
  reuniao: { label:'Reunião', color:'#5dade2', icon:'🤝' },
  entrega: { label:'Entrega', color:'#5db872', icon:'🚚' },
}
const CAT_FIXO = ['Aluguel da oficina','Salários fixos','Energia elétrica','Outro fixo']
const CAT_VAR  = ['Material / Madeira','Ferramenta / Equip.','Frete / Entrega','Marketing','Outro variável']
const CAT_ENT  = ['Serviço / Venda','Sinal recebido','Pagamento final','Outro']

const api = {
  get:    path         => fetch(`/api/${path}`).then(r=>r.json()),
  post:   (path, body) => fetch(`/api/${path}`,{method:'POST',  headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()),
  put:    (path, body) => fetch(`/api/${path}`,{method:'PUT',   headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()),
  delete: (path, body) => fetch(`/api/${path}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()),
}

let _toast = null
function Toast() {
  const [msg,setMsg]=useState(null)
  useEffect(()=>{ _toast=(m,color='#5db872')=>{setMsg({m,color});setTimeout(()=>setMsg(null),2800)} },[])
  if(!msg)return null
  return <div style={{position:'fixed',bottom:24,right:24,background:'#1e1812',border:'1px solid #3a2e20',borderLeft:`3px solid ${msg.color}`,borderRadius:9,padding:'10px 16px',color:'#e8dcc8',fontSize:13,zIndex:999,boxShadow:'0 4px 20px rgba(0,0,0,.5)',fontFamily:'Georgia,serif'}}>{msg.m}</div>
}

const Label = ({children}) => <label style={{display:'block',fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'#7a6a55',marginBottom:5,fontWeight:700}}>{children}</label>
const Field = ({label,children}) => <div style={{marginBottom:14}}>{label&&<Label>{label}</Label>}{children}</div>
const Row2  = ({children}) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{children}</div>

const Btn = ({variant='ghost',sm,onClick,children,style={}}) => {
  const base={padding:sm?'4px 10px':'8px 18px',borderRadius:7,cursor:'pointer',fontSize:sm?11:12,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.03em',border:'none',transition:'opacity .15s'}
  const vars={gold:{background:'#d4a030',color:'#16120e'},ghost:{background:'transparent',color:'#7a6a55',border:'1px solid #3a2e20'},green:{background:'#3a7a4e',color:'#fff'},red:{background:'#a02020',color:'#fff'},blue:{background:'#1a5a90',color:'#fff'}}
  return <button style={{...base,...(vars[variant]||vars.ghost),...style}} onClick={onClick}>{children}</button>
}

const Badge = ({color,bg,border,children}) => <span style={{display:'inline-flex',alignItems:'center',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:700,color,background:bg||color+'22',border:`1px solid ${border||color+'44'}`,whiteSpace:'nowrap'}}>{children}</span>

const StatCard = ({label,value,sub,accent}) => (
  <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderLeft:`3px solid ${accent}`,borderRadius:10,padding:'16px 18px'}}>
    <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'#7a6a55',marginBottom:6}}>{label}</div>
    <div style={{fontFamily:'Georgia,serif',fontSize:26,color:accent,fontStyle:'italic'}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:'#7a6a55',marginTop:4}}>{sub}</div>}
  </div>
)

const Grid = ({cols=220,children,style={}}) => <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${cols}px,1fr))`,gap:14,...style}}>{children}</div>

const Modal = ({title,onClose,children,footer}) => (
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(3px)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:14,padding:24,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#e8dcc8',fontStyle:'italic',marginBottom:20,paddingBottom:12,borderBottom:'1px solid #3a2e20'}}>{title}</div>
      {children}
      {footer&&<div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>{footer}</div>}
    </div>
  </div>
)

// ── SERVIÇOS ──────────────────────────────────────────────────────────────────
function ServicosPage({servicos,reload}){
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [pagForm,setPagForm]=useState({})
  const [saving,setSaving]=useState(false)
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const fp=k=>e=>setPagForm(p=>({...p,[k]:e.target.value}))

  const openNew=()=>{setForm({status:'orcamento',criadoEm:today()});setModal('new')}
  const openEdit=item=>{setForm({...item});setModal('edit')}
  const openPagar=item=>{setPagForm({servicoId:item.id,cliente:item.cliente,pendente:saldoPendente(item),data:today(),valor:''});setModal('pagar')}

  const save=async()=>{
    if(!form.cliente?.trim()||!form.desc?.trim()){_toast?.('Preencha cliente e descrição.','#e05545');return}
    setSaving(true)
    const prev=servicos.find(s=>s.id===form.id)
    const prevSinal=parseFloat(prev?.sinal||0)
    const newSinal=parseFloat(form.sinal||0)
    if(modal==='edit'){
      await api.put('servicos',form)
      if(newSinal>prevSinal){
        const diff=newSinal-prevSinal
        await api.post('caixa',{id:uid(),tipo:'entrada',cat:'Sinal recebido',desc:`Sinal — ${form.cliente}`,valor:diff,data:today(),natureza:'variavel',servicoId:form.id})
      }
      _toast?.('Serviço atualizado ✓')
    } else {
      const novo={...form,id:uid()}
      await api.post('servicos',novo)
      if(newSinal>0) await api.post('caixa',{id:uid(),tipo:'entrada',cat:'Sinal recebido',desc:`Sinal — ${form.cliente}`,valor:newSinal,data:today(),natureza:'variavel',servicoId:novo.id})
      _toast?.('Serviço adicionado ✓')
    }
    await reload();setSaving(false);setModal(null)
  }

  const salvarPagamento=async()=>{
    const valor=parseFloat(pagForm.valor)
    if(!valor||!pagForm.data){_toast?.('Informe valor e data.','#e05545');return}
    const s=servicos.find(x=>x.id===pagForm.servicoId)
    if(!s)return
    if(valor>saldoPendente(s)+0.01){_toast?.(`Valor maior que o pendente (${fmtMoney(saldoPendente(s))}).`,'#e05545');return}
    const novoValorPago=(parseFloat(s.valorPago)||0)+valor
    await api.put('servicos',{...s,valorPago:novoValorPago,dataPagamento:pagForm.data})
    await api.post('caixa',{id:uid(),tipo:'entrada',cat:'Pagamento final',desc:`Pagamento — ${s.cliente}`,valor,data:pagForm.data,natureza:'variavel',servicoId:s.id})
    await reload();_toast?.('Pagamento registrado e lançado no caixa ✓');setModal(null)
  }

  const del=async id=>{
    if(!confirm('Remover este serviço?'))return
    await api.delete('servicos',{id});await reload();_toast?.('Removido.','#e05545')
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:'#e8dcc8'}}>Serviços</div>
          <div style={{fontSize:12,color:'#7a6a55',marginTop:4}}>Acompanhe todos os trabalhos por status.</div>
        </div>
        <Btn variant="gold" onClick={openNew}>+ Novo Serviço</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
        {Object.entries(STATUS_CFG).map(([status,cfg])=>{
          const items=servicos.filter(s=>s.status===status)
          return(
            <div key={status} style={{background:'#1e1812',border:'1px solid #3a2e20',borderTop:`2px solid ${cfg.color}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700,color:cfg.color,borderBottom:'1px solid #3a2e20'}}>
                <span>{cfg.label}</span><span style={{color:'#7a6a55'}}>{items.length}</span>
              </div>
              <div style={{padding:10,minHeight:60}}>
                {items.length===0&&<div style={{color:'#7a6a55',fontSize:12,fontStyle:'italic',textAlign:'center',padding:'12px 0'}}>Nenhum serviço</div>}
                {items.map(s=>{
                  const pend=saldoPendente(s)
                  const quitado=pend<=0&&(s.valor||0)>0
                  return(
                    <div key={s.id} onClick={()=>openEdit(s)} style={{background:'#28211a',border:'1px solid #3a2e20',borderLeft:`3px solid ${cfg.color}`,borderRadius:8,padding:'10px 12px',cursor:'pointer',marginBottom:8}}>
                      <div style={{fontWeight:700,fontSize:13,color:'#e8dcc8',marginBottom:4}}>{s.cliente}</div>
                      <div style={{fontSize:11,color:'#7a6a55',lineHeight:1.6,marginBottom:4}}>
                        {s.desc?.slice(0,50)}{s.desc?.length>50?'...':''}<br/>
                        {s.marceneiro&&<span style={{color:'#a07040'}}>🪚 {s.marceneiro}<br/></span>}
                      </div>
                      {s.valor>0&&(
                        <div style={{fontSize:11,background:'#1e1812',borderRadius:6,padding:'5px 8px',marginBottom:6}}>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#7a6a55'}}>Total</span><span style={{color:'#d4a030',fontWeight:700}}>{fmtMoney(s.valor)}</span></div>
                          {s.sinal>0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#7a6a55'}}>Sinal</span><span style={{color:'#5db872'}}>− {fmtMoney(s.sinal)}</span></div>}
                          {s.valorPago>0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#7a6a55'}}>Pago</span><span style={{color:'#5db872'}}>− {fmtMoney(s.valorPago)}</span></div>}
                          <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid #3a2e20',marginTop:3,paddingTop:3}}>
                            <span style={{color:'#7a6a55'}}>Pendente</span>
                            <span style={{color:quitado?'#5db872':'#f0a040',fontWeight:700}}>{quitado?'✓ Quitado':fmtMoney(pend)}</span>
                          </div>
                        </div>
                      )}
                      {s.prazoEntrega&&<div style={{fontSize:10,color:'#7a6a55',marginBottom:6}}>📅 Entrega: {fmtDate(s.prazoEntrega)}</div>}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
                        {!quitado&&pend>0?<Btn variant="green" sm onClick={e=>{e.stopPropagation();openPagar(s)}}>💰 Registrar pagamento</Btn>:<span/>}
                        <Btn variant="ghost" sm onClick={e=>{e.stopPropagation();del(s.id)}}>✕</Btn>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {(modal==='new'||modal==='edit')&&(
        <Modal title={modal==='edit'?'Editar Serviço':'Novo Serviço'} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant="gold" onClick={save}>{saving?'Salvando…':'Salvar'}</Btn>]}>
          <Row2>
            <Field label="Cliente *"><input value={form.cliente||''} onChange={f('cliente')} placeholder="Nome do cliente"/></Field>
            <Field label="Status"><select value={form.status||'orcamento'} onChange={f('status')}>{Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
          </Row2>
          <Field label="Descrição *"><textarea value={form.desc||''} onChange={f('desc')} placeholder="Ex: Armário 3 portas MDF branco..." style={{minHeight:64,resize:'vertical'}}/></Field>
          <Row2>
            <Field label="Valor total (R$)"><input type="number" value={form.valor||''} onChange={f('valor')} placeholder="0,00"/></Field>
            <Field label="Sinal recebido (R$)">
              <input type="number" value={form.sinal||''} onChange={f('sinal')} placeholder="0,00"/>
              <div style={{fontSize:10,color:'#7a6a55',marginTop:3}}>Lançado automaticamente no caixa</div>
            </Field>
          </Row2>
          <Field label="Marceneiro responsável"><select value={form.marceneiro||''} onChange={f('marceneiro')}><option value="">— Selecionar —</option>{MARCENEIROS.map(m=><option key={m} value={m}>{m}</option>)}</select></Field>
          <Row2>
            <Field label="Início da produção"><input type="date" value={form.dataInicio||''} onChange={f('dataInicio')}/></Field>
            <Field label="Conclusão da produção"><input type="date" value={form.dataConclusao||''} onChange={f('dataConclusao')}/></Field>
          </Row2>
          <Field label="Prazo de entrega ao cliente"><input type="date" value={form.prazoEntrega||''} onChange={f('prazoEntrega')}/></Field>
          <Field label="Observações"><textarea value={form.obs||''} onChange={f('obs')} placeholder="Materiais, detalhes, contato..." style={{minHeight:56,resize:'vertical'}}/></Field>
        </Modal>
      )}

      {modal==='pagar'&&(
        <Modal title={`💰 Registrar Pagamento — ${pagForm.cliente}`} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant="green" onClick={salvarPagamento}>Confirmar Pagamento</Btn>]}>
          <div style={{background:'#28211a',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13}}>
            <span style={{color:'#7a6a55'}}>Valor pendente: </span>
            <strong style={{color:'#f0a040'}}>{fmtMoney(pagForm.pendente)}</strong>
          </div>
          <Row2>
            <Field label="Valor recebido (R$) *"><input type="number" value={pagForm.valor||''} onChange={fp('valor')} placeholder="0,00"/></Field>
            <Field label="Data do pagamento *"><input type="date" value={pagForm.data||today()} onChange={fp('data')}/></Field>
          </Row2>
          <div style={{fontSize:11,color:'#7a6a55',fontStyle:'italic'}}>Este valor será lançado automaticamente no fluxo de caixa como entrada.</div>
        </Modal>
      )}
    </div>
  )
}

// ── ORÇAMENTOS ────────────────────────────────────────────────────────────────
function OrcamentosPage({orcamentos,reload}){
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [search,setSearch]=useState('')
  const [filtroMes,setFiltroMes]=useState(currentMonth())
  const [abaOrc,setAbaOrc]=useState('mensal') // 'mensal' | 'todos'
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}))

  const save=async()=>{
    if(!form.cliente?.trim()||!form.valor){_toast?.('Preencha cliente e valor.','#e05545');return}
    if(modal?.id){await api.put('orcamentos',form);_toast?.('Atualizado ✓')}
    else{await api.post('orcamentos',{...form,id:uid()});_toast?.('Orçamento adicionado ✓')}
    await reload();setModal(null)
  }
  const del=async id=>{if(!confirm('Remover?'))return;await api.delete('orcamentos',{id});await reload();_toast?.('Removido.','#e05545')}

  // totais gerais
  const total=orcamentos.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const aprovadosTotal=orcamentos.filter(o=>o.status==='aprovado')
  const totalAprovGeral=aprovadosTotal.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const taxaGeral=orcamentos.length?Math.round(aprovadosTotal.length/orcamentos.length*100):0

  // totais do mês
  const doMes=orcamentos.filter(o=>o.data?.startsWith(filtroMes))
  const totalMes=doMes.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const aprovMes=doMes.filter(o=>o.status==='aprovado')
  const totalAprovMes=aprovMes.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const taxaMes=doMes.length?Math.round(aprovMes.length/doMes.length*100):0

  // resumo por status do mês
  const resumoStatus=Object.entries(ORC_STATUS).map(([k,v])=>{
    const items=doMes.filter(o=>o.status===k)
    return{key:k,...v,qtd:items.length,valor:items.reduce((a,o)=>a+parseFloat(o.valor||0),0)}
  }).filter(r=>r.qtd>0)

  const tableData=abaOrc==='mensal'
    ?doMes.filter(o=>o.cliente?.toLowerCase().includes(search.toLowerCase())||o.desc?.toLowerCase().includes(search.toLowerCase()))
    :orcamentos.filter(o=>o.cliente?.toLowerCase().includes(search.toLowerCase())||o.desc?.toLowerCase().includes(search.toLowerCase()))

  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div><div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:'#e8dcc8'}}>Orçamentos</div><div style={{fontSize:12,color:'#7a6a55',marginTop:4}}>Controle de orçamentos e aprovações.</div></div>
        <Btn variant="gold" onClick={()=>{setForm({status:'enviado',data:today()});setModal({})}}>+ Novo Orçamento</Btn>
      </div>

      {/* Totais gerais */}
      <Grid cols={200} style={{marginBottom:20}}>
        <StatCard label="Total orçado (geral)" value={fmtMoney(total)} sub={`${orcamentos.length} orçamentos`} accent="#d4a030"/>
        <StatCard label="Aprovados (geral)" value={fmtMoney(totalAprovGeral)} sub={`${aprovadosTotal.length} aprovados`} accent="#5db872"/>
        <StatCard label="Conversão (geral)" value={`${taxaGeral}%`} sub="histórico total" accent="#5dade2"/>
      </Grid>

      {/* Aba mensal / todos */}
      <div style={{display:'flex',borderBottom:'1px solid #3a2e20',marginBottom:16,alignItems:'center',gap:0}}>
        {[['mensal','📅 Resumo do mês'],['todos','📋 Todos']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setAbaOrc(id)} style={{padding:'10px 16px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.04em',textTransform:'uppercase',background:'none',border:'none',borderBottom:`2px solid ${abaOrc===id?'#d4a030':'transparent'}`,color:abaOrc===id?'#d4a030':'#7a6a55',transition:'all .2s'}}>{lbl}</button>
        ))}
        {abaOrc==='mensal'&&(
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,paddingBottom:8}}>
            <span style={{fontSize:12,color:'#7a6a55'}}>Mês:</span>
            <input type="month" style={{width:155}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/>
          </div>
        )}
      </div>

      {abaOrc==='mensal'&&(
        <>
          {/* Stats do mês */}
          <Grid cols={180} style={{marginBottom:16}}>
            <StatCard label="Orçado no mês" value={fmtMoney(totalMes)} sub={`${doMes.length} orçamentos`} accent="#d4a030"/>
            <StatCard label="Aprovados no mês" value={fmtMoney(totalAprovMes)} sub={`${aprovMes.length} aprovados`} accent="#5db872"/>
            <StatCard label="Conversão do mês" value={`${taxaMes}%`} sub={`${doMes.length} orçamentos`} accent="#5dade2"/>
          </Grid>
          {/* Resumo por status */}
          {resumoStatus.length>0&&(
            <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,padding:16,marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:12,color:'#7a6a55',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Resumo por status</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
                {resumoStatus.map(r=>(
                  <div key={r.key} style={{background:'#28211a',borderRadius:8,padding:'10px 14px',borderLeft:`3px solid ${r.color}`}}>
                    <div style={{fontSize:11,color:r.color,fontWeight:700,marginBottom:4}}>{r.label}</div>
                    <div style={{fontSize:16,color:'#e8dcc8',fontFamily:'Georgia,serif',fontStyle:'italic',fontWeight:700}}>{fmtMoney(r.valor)}</div>
                    <div style={{fontSize:11,color:'#7a6a55',marginTop:2}}>{r.qtd} orçamento{r.qtd!==1?'s':''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabela */}
      <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #3a2e20',flexWrap:'wrap',gap:10}}>
          <span style={{fontWeight:700,fontSize:13,color:'#e8dcc8'}}>{abaOrc==='mensal'?`Orçamentos de ${filtroMes}`:'Todos os orçamentos'}</span>
          <input style={{width:200}} placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <table>
          <thead><tr>{['Cliente','Descrição','Valor','Data','Status',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {tableData.length===0&&<tr><td colSpan={6} style={{textAlign:'center',color:'#7a6a55',fontStyle:'italic',padding:'24px'}}>Nenhum orçamento.</td></tr>}
            {tableData.map(o=>{
              const cfg=ORC_STATUS[o.status]||ORC_STATUS.enviado
              return(
                <tr key={o.id} style={{cursor:'pointer'}} onClick={()=>{setForm({...o});setModal({id:o.id})}}>
                  <td><strong>{o.cliente}</strong></td>
                  <td style={{color:'#7a6a55',maxWidth:200}}>{o.desc?.slice(0,60)}{o.desc?.length>60?'...':''}</td>
                  <td><strong style={{color:'#d4a030'}}>{fmtMoney(o.valor)}</strong></td>
                  <td>{fmtDate(o.data)}</td>
                  <td><Badge color={cfg.color}>{cfg.label}</Badge></td>
                  <td onClick={e=>e.stopPropagation()}><Btn variant="ghost" sm onClick={()=>del(o.id)}>✕</Btn></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {modal&&(
        <Modal title={modal.id?'Editar Orçamento':'Novo Orçamento'} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant="gold" onClick={save}>Salvar</Btn>]}>
          <Row2>
            <Field label="Cliente *"><input value={form.cliente||''} onChange={f('cliente')} placeholder="Nome do cliente"/></Field>
            <Field label="Data"><input type="date" value={form.data||today()} onChange={f('data')}/></Field>
          </Row2>
          <Field label="Descrição *"><textarea value={form.desc||''} onChange={f('desc')} placeholder="O que o cliente quer?" style={{minHeight:64,resize:'vertical'}}/></Field>
          <Row2>
            <Field label="Valor orçado (R$) *"><input type="number" value={form.valor||''} onChange={f('valor')} placeholder="0,00"/></Field>
            <Field label="Status"><select value={form.status||'enviado'} onChange={f('status')}>{Object.entries(ORC_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
          </Row2>
          <Field label="Observações"><textarea value={form.obs||''} onChange={f('obs')} placeholder="Detalhes adicionais..." style={{minHeight:56,resize:'vertical'}}/></Field>
        </Modal>
      )}
    </div>
  )
}

// ── COMPROMISSOS ──────────────────────────────────────────────────────────────
function CompromissosPage({compromissos,reload}){
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [filtroMes,setFiltroMes]=useState(currentMonth())
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}))

  const save=async()=>{
    if(!form.titulo?.trim()||!form.data){_toast?.('Preencha título e data.','#e05545');return}
    if(modal?.id){await api.put('compromissos',form);_toast?.('Compromisso atualizado ✓')}
    else{await api.post('compromissos',{...form,id:uid()});_toast?.('Compromisso adicionado ✓')}
    await reload();setModal(null)
  }
  const del=async id=>{if(!confirm('Remover?'))return;await api.delete('compromissos',{id});await reload();_toast?.('Removido.','#e05545')}
  const toggleFeito=async item=>{await api.put('compromissos',{...item,feito:!item.feito});await reload()}

  const doMes=compromissos.filter(c=>c.data?.startsWith(filtroMes)).sort((a,b)=>a.data.localeCompare(b.data))
  const porData=doMes.reduce((acc,c)=>{if(!acc[c.data])acc[c.data]=[];acc[c.data].push(c);return acc},{})
  const proximos=compromissos.filter(c=>c.data>=today()&&!c.feito).sort((a,b)=>a.data.localeCompare(b.data)).slice(0,3)

  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div><div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:'#e8dcc8'}}>Compromissos</div><div style={{fontSize:12,color:'#7a6a55',marginTop:4}}>Reuniões com clientes e entregas agendadas.</div></div>
        <Btn variant="gold" onClick={()=>{setForm({tipo:'reuniao',data:today()});setModal({})}}>+ Novo Compromisso</Btn>
      </div>

      {proximos.length>0&&(
        <div style={{background:'rgba(212,160,48,.08)',border:'1px solid rgba(212,160,48,.25)',borderRadius:10,padding:16,marginBottom:20}}>
          <div style={{fontSize:12,textTransform:'uppercase',letterSpacing:'.08em',color:'#d4a030',fontWeight:700,marginBottom:12}}>📌 Próximos compromissos</div>
          {proximos.map(c=>{
            const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
            return(
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,fontSize:13,marginBottom:8}}>
                <span style={{fontSize:16}}>{cfg.icon}</span>
                <div><strong style={{color:'#e8dcc8'}}>{c.titulo}</strong>{c.cliente&&<span style={{color:'#7a6a55'}}> — {c.cliente}</span>}</div>
                <div style={{marginLeft:'auto',color:'#d4a030',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(c.data)}{c.hora?` às ${c.hora}`:''}</div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <span style={{fontSize:12,color:'#7a6a55'}}>Mês:</span>
        <input type="month" style={{width:160}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/>
        <span style={{fontSize:12,color:'#7a6a55'}}>{doMes.length} compromisso{doMes.length!==1?'s':''}</span>
      </div>

      {Object.keys(porData).length===0&&(
        <div style={{textAlign:'center',color:'#7a6a55',fontStyle:'italic',padding:'32px',background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10}}>Nenhum compromisso neste mês.</div>
      )}
      {Object.entries(porData).map(([data,items])=>(
        <div key={data} style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
            <div style={{background:'#d4a030',color:'#16120e',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{fmtDate(data)}</div>
            <div style={{flex:1,height:1,background:'#3a2e20'}}/>
          </div>
          {items.map(c=>{
            const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
            return(
              <div key={c.id} style={{background:'#1e1812',border:'1px solid #3a2e20',borderLeft:`3px solid ${cfg.color}`,borderRadius:9,padding:'12px 16px',display:'flex',alignItems:'flex-start',gap:12,opacity:c.feito?.5:1,marginBottom:8}}>
                <span style={{fontSize:20,flexShrink:0}}>{cfg.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <strong style={{fontSize:14,color:c.feito?'#7a6a55':'#e8dcc8',textDecoration:c.feito?'line-through':'none'}}>{c.titulo}</strong>
                    <Badge color={cfg.color}>{cfg.label}</Badge>
                    {c.feito&&<Badge color="#5db872">✓ Concluído</Badge>}
                  </div>
                  {c.cliente&&<div style={{fontSize:12,color:'#a07040',marginBottom:2}}>👤 {c.cliente}</div>}
                  {c.hora&&<div style={{fontSize:12,color:'#7a6a55',marginBottom:2}}>🕐 {c.hora}</div>}
                  {c.local&&<div style={{fontSize:12,color:'#7a6a55',marginBottom:2}}>📍 {c.local}</div>}
                  {c.obs&&<div style={{fontSize:12,color:'#7a6a55',fontStyle:'italic',marginTop:4}}>{c.obs}</div>}
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <Btn variant={c.feito?'ghost':'green'} sm onClick={()=>toggleFeito(c)}>{c.feito?'↩':'✓ Feito'}</Btn>
                  <Btn variant="ghost" sm onClick={()=>{setForm({...c});setModal({id:c.id})}}>✏️</Btn>
                  <Btn variant="ghost" sm onClick={()=>del(c.id)}>✕</Btn>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {modal&&(
        <Modal title={modal.id?'Editar Compromisso':'Novo Compromisso'} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant="gold" onClick={save}>Salvar</Btn>]}>
          <Field label="Tipo"><select value={form.tipo||'reuniao'} onChange={f('tipo')}>{Object.entries(COMP_TIPOS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Field>
          <Field label="Título *"><input value={form.titulo||''} onChange={f('titulo')} placeholder="Ex: Visita técnica João / Entrega armário Maria"/></Field>
          <Field label="Cliente"><input value={form.cliente||''} onChange={f('cliente')} placeholder="Nome do cliente"/></Field>
          <Row2>
            <Field label="Data *"><input type="date" value={form.data||today()} onChange={f('data')}/></Field>
            <Field label="Horário"><input type="time" value={form.hora||''} onChange={f('hora')}/></Field>
          </Row2>
          <Field label="Local / Endereço"><input value={form.local||''} onChange={f('local')} placeholder="Rua, bairro ou 'Na oficina'"/></Field>
          <Field label="Observações"><textarea value={form.obs||''} onChange={f('obs')} placeholder="Detalhes adicionais..." style={{minHeight:56,resize:'vertical'}}/></Field>
        </Modal>
      )}
    </div>
  )
}

// ── CAIXA ─────────────────────────────────────────────────────────────────────
function CaixaPage({caixa,reload}){
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [filtroTipo,setFiltroTipo]=useState('')
  const [filtroMes,setFiltroMes]=useState(currentMonth())
  const [aba,setAba]=useState('movimentos')
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}))

  const openModal=tipo=>{setForm({tipo,data:today(),natureza:tipo==='saida'?'variavel':undefined});setModal(tipo)}
  const save=async()=>{
    if(!form.desc?.trim()||!form.valor||!form.data){_toast?.('Preencha todos os campos.','#e05545');return}
    await api.post('caixa',{...form,id:uid(),valor:parseFloat(form.valor)})
    await reload();setModal(null)
    _toast?.(form.tipo==='entrada'?'Entrada registrada ✓':'Saída registrada ✓',form.tipo==='entrada'?'#5db872':'#e05545')
  }
  const del=async id=>{if(!confirm('Remover?'))return;await api.delete('caixa',{id});await reload();_toast?.('Removido.','#e05545')}

  let filtered=caixa
  if(filtroTipo)filtered=filtered.filter(c=>c.tipo===filtroTipo)
  if(filtroMes)filtered=filtered.filter(c=>c.data?.startsWith(filtroMes))

  const totalEnt=caixa.filter(c=>c.tipo==='entrada').reduce((a,c)=>a+c.valor,0)
  const totalFix=caixa.filter(c=>c.tipo==='saida'&&c.natureza==='fixo').reduce((a,c)=>a+c.valor,0)
  const totalVar=caixa.filter(c=>c.tipo==='saida'&&c.natureza==='variavel').reduce((a,c)=>a+c.valor,0)
  const saldo=totalEnt-totalFix-totalVar
  const mesEnt=caixa.filter(c=>c.tipo==='entrada'&&c.data?.startsWith(filtroMes)).reduce((a,c)=>a+c.valor,0)
  const mesFix=caixa.filter(c=>c.tipo==='saida'&&c.natureza==='fixo'&&c.data?.startsWith(filtroMes)).reduce((a,c)=>a+c.valor,0)
  const mesVar=caixa.filter(c=>c.tipo==='saida'&&c.natureza==='variavel'&&c.data?.startsWith(filtroMes)).reduce((a,c)=>a+c.valor,0)
  const margem=mesEnt-mesVar
  const lucro=mesEnt-mesVar-mesFix

  const months=[]
  for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const key=d.toISOString().slice(0,7);months.push({lbl:d.toLocaleDateString('pt-BR',{month:'short'}),ent:caixa.filter(c=>c.tipo==='entrada'&&c.data?.startsWith(key)).reduce((a,c)=>a+c.valor,0),fix:caixa.filter(c=>c.tipo==='saida'&&c.natureza==='fixo'&&c.data?.startsWith(key)).reduce((a,c)=>a+c.valor,0),vari:caixa.filter(c=>c.tipo==='saida'&&c.natureza==='variavel'&&c.data?.startsWith(key)).reduce((a,c)=>a+c.valor,0)})}
  const maxBar=Math.max(...months.map(m=>Math.max(m.ent,m.fix+m.vari)),1)
  const catOptions=modal==='entrada'?CAT_ENT:(form.natureza==='fixo'?CAT_FIXO:CAT_VAR)

  // categoria breakdown helper
  const catBreakdown=(items,cats)=>cats.map(cat=>({cat,valor:items.filter(c=>c.cat===cat).reduce((a,c)=>a+c.valor,0),qtd:items.filter(c=>c.cat===cat).length})).filter(r=>r.valor>0)

  const todasCats=[...CAT_ENT,...CAT_FIXO,...CAT_VAR]
  // por mês
  const mesEntItems=caixa.filter(c=>c.tipo==='entrada'&&c.data?.startsWith(filtroMes))
  const mesSaiItems=caixa.filter(c=>c.tipo==='saida'&&c.data?.startsWith(filtroMes))
  // totais
  const allEntItems=caixa.filter(c=>c.tipo==='entrada')
  const allSaiItems=caixa.filter(c=>c.tipo==='saida')

  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div><div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:'#e8dcc8'}}>Fluxo de Caixa</div><div style={{fontSize:12,color:'#7a6a55',marginTop:4}}>Entradas, saídas, custos fixos e variáveis.</div></div>
        <div style={{display:'flex',gap:8}}><Btn variant="green" onClick={()=>openModal('entrada')}>+ Entrada</Btn><Btn variant="red" onClick={()=>openModal('saida')}>+ Saída</Btn></div>
      </div>
      <Grid cols={200} style={{marginBottom:20}}>
        <StatCard label="Total entradas" value={fmtMoney(totalEnt)} sub="histórico geral" accent="#5db872"/>
        <StatCard label="Custos fixos" value={fmtMoney(totalFix)} sub="histórico geral" accent="#e05545"/>
        <StatCard label="Custos variáveis" value={fmtMoney(totalVar)} sub="histórico geral" accent="#f0a040"/>
        <StatCard label="Saldo atual" value={fmtMoney(saldo)} sub="entradas − saídas" accent={saldo>=0?'#5db872':'#e05545'}/>
      </Grid>
      <div style={{display:'flex',borderBottom:'1px solid #3a2e20',marginBottom:16,alignItems:'center'}}>
        {[['movimentos','📋 Movimentos'],['categorias','🏷️ Categorias'],['dre','📊 DRE'],['grafico','📈 Gráfico']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setAba(id)} style={{padding:'10px 14px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.04em',textTransform:'uppercase',background:'none',border:'none',borderBottom:`2px solid ${aba===id?'#d4a030':'transparent'}`,color:aba===id?'#d4a030':'#7a6a55',transition:'all .2s'}}>{lbl}</button>
        ))}
        {/* Filtro de mês sempre visível à direita */}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,paddingBottom:8}}>
          <span style={{fontSize:11,color:'#7a6a55'}}>Mês:</span>
          <input type="month" style={{width:150}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/>
        </div>
      </div>
      {aba==='movimentos'&&(
        <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #3a2e20',flexWrap:'wrap',gap:10}}>
            <span style={{fontWeight:700,fontSize:13,color:'#e8dcc8'}}>Movimentações</span>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <select style={{width:140}} value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}><option value="">Todos</option><option value="entrada">Entradas</option><option value="saida">Saídas</option></select>
            </div>
          </div>
          <table>
            <thead><tr>{['Data','Tipo','Natureza','Categoria','Descrição','Valor',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:'center',color:'#7a6a55',fontStyle:'italic',padding:'24px'}}>Nenhuma movimentação.</td></tr>}
              {filtered.map(c=>{const cor=c.tipo==='entrada'?'#5db872':c.natureza==='fixo'?'#e05545':'#f0a040';return(
                <tr key={c.id}>
                  <td>{fmtDate(c.data)}</td>
                  <td><Badge color={cor}>{c.tipo==='entrada'?'↑ Entrada':'↓ Saída'}</Badge></td>
                  <td><Badge color="#a07040">{c.natureza==='fixo'?'Fixo':'Variável'}</Badge></td>
                  <td style={{color:'#7a6a55',fontSize:12}}>{c.cat}</td>
                  <td>{c.desc}</td>
                  <td><strong style={{color:cor}}>{fmtMoney(c.valor)}</strong></td>
                  <td><Btn variant="ghost" sm onClick={()=>del(c.id)}>✕</Btn></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
      {aba==='categorias'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Selector mensal/total */}
          {[
            {titulo:'↑ Entradas por categoria',items:mesEntItems,allItems:allEntItems,cor:'#5db872',cats:CAT_ENT},
            {titulo:'↓ Saídas — Custos Fixos',items:mesSaiItems.filter(c=>c.natureza==='fixo'),allItems:allSaiItems.filter(c=>c.natureza==='fixo'),cor:'#e05545',cats:CAT_FIXO},
            {titulo:'↓ Saídas — Custos Variáveis',items:mesSaiItems.filter(c=>c.natureza==='variavel'),allItems:allSaiItems.filter(c=>c.natureza==='variavel'),cor:'#f0a040',cats:CAT_VAR},
          ].map(grupo=>{
            const mesCats=catBreakdown(grupo.items,grupo.cats.concat(['Outro','Sinal recebido','Pagamento final','Serviço / Venda']))
            const allCats=catBreakdown(grupo.allItems,grupo.cats.concat(['Outro','Sinal recebido','Pagamento final','Serviço / Venda']))
            const mesTot=grupo.items.reduce((a,c)=>a+c.valor,0)
            const allTot=grupo.allItems.reduce((a,c)=>a+c.valor,0)
            const maxVal=Math.max(...allCats.map(c=>c.valor),1)
            if(allCats.length===0)return null
            return(
              <div key={grupo.titulo} style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #3a2e20',flexWrap:'wrap',gap:8}}>
                  <span style={{fontWeight:700,fontSize:13,color:grupo.cor}}>{grupo.titulo}</span>
                  <div style={{display:'flex',gap:16,fontSize:12}}>
                    <span style={{color:'#7a6a55'}}>Mês: <strong style={{color:grupo.cor}}>{fmtMoney(mesTot)}</strong></span>
                    <span style={{color:'#7a6a55'}}>Total: <strong style={{color:'#e8dcc8'}}>{fmtMoney(allTot)}</strong></span>
                  </div>
                </div>
                <div style={{padding:16}}>
                  {allCats.map(r=>{
                    const mesCat=mesCats.find(m=>m.cat===r.cat)
                    return(
                      <div key={r.cat} style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12}}>
                          <span style={{color:'#e8dcc8',fontWeight:600}}>{r.cat}</span>
                          <div style={{display:'flex',gap:16}}>
                            <span style={{color:'#7a6a55'}}>Mês: <strong style={{color:grupo.cor}}>{fmtMoney(mesCat?.valor||0)}</strong></span>
                            <span style={{color:'#7a6a55'}}>Total: <strong style={{color:'#e8dcc8'}}>{fmtMoney(r.valor)}</strong></span>
                          </div>
                        </div>
                        <div style={{background:'#28211a',borderRadius:4,height:14,overflow:'hidden',position:'relative'}}>
                          {/* barra total */}
                          <div style={{position:'absolute',top:0,left:0,width:`${Math.round(r.valor/maxVal*100)}%`,height:'100%',background:grupo.cor+'33',borderRadius:4}}/>
                          {/* barra mês */}
                          {mesCat&&<div style={{position:'absolute',top:0,left:0,width:`${Math.round((mesCat.valor||0)/maxVal*100)}%`,height:'100%',background:`linear-gradient(90deg,${grupo.cor}99,${grupo.cor})`,borderRadius:4}}/>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

        <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,padding:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
            <span style={{color:'#7a6a55',fontSize:12}}>Mês de referência:</span>
            <input type="month" style={{width:160}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/>
          </div>
          {[{label:'Receita Bruta',value:mesEnt,color:'#5db872',bold:true},{label:'( − ) Custos Variáveis',value:-mesVar,color:'#f0a040'},{label:'= Margem Bruta',value:margem,color:margem>=0?'#5db872':'#e05545',bold:true,border:true},{label:'( − ) Custos Fixos',value:-mesFix,color:'#e05545'},{label:'= Lucro Líquido',value:lucro,color:lucro>=0?'#5db872':'#e05545',bold:true,big:true,border:true}].map((row,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:row.border?12:6,paddingBottom:6,borderTop:row.border?'1px solid #3a2e20':'none',marginBottom:4}}>
              <span style={{fontSize:row.big?15:13,fontWeight:row.bold?700:400,color:row.bold?'#e8dcc8':'#a09080'}}>{row.label}</span>
              <span style={{fontSize:row.big?20:14,fontWeight:700,color:row.color,fontFamily:'Georgia,serif',fontStyle:'italic'}}>{fmtMoney(Math.abs(row.value))}</span>
            </div>
          ))}
          {mesEnt>0&&<div style={{marginTop:16,padding:'10px 14px',background:'#28211a',borderRadius:8,fontSize:12,color:'#7a6a55'}}>Margem líquida: <strong style={{color:lucro>=0?'#5db872':'#e05545'}}>{Math.round(lucro/mesEnt*100)}%</strong> · Ponto de equilíbrio: <strong style={{color:'#d4a030'}}>{fmtMoney(mesFix)}</strong></div>}
        </div>
      )}
      {aba==='grafico'&&(
        <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,padding:24}}>
          <div style={{marginBottom:16,fontSize:13,color:'#7a6a55'}}>Últimos 6 meses — Entradas vs Custos</div>
          {months.map((m,i)=>(
            <div key={i} style={{marginBottom:18}}>
              <div style={{fontSize:11,color:'#7a6a55',marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>{m.lbl}</div>
              {[{label:'Entrada',val:m.ent,dark:'#2a6a3e',light:'#5db872'},{label:'Fixo',val:m.fix,dark:'#7a1818',light:'#e05545'},{label:'Variável',val:m.vari,dark:'#7a4010',light:'#f0a040'}].map(bar=>(
                <div key={bar.label} style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
                  <div style={{width:58,fontSize:10,color:bar.light,textAlign:'right'}}>{bar.label}</div>
                  <div style={{flex:1,background:'#28211a',borderRadius:4,height:18,overflow:'hidden'}}>
                    <div style={{width:`${Math.round(bar.val/maxBar*100)}%`,height:'100%',minWidth:bar.val>0?28:0,background:`linear-gradient(90deg,${bar.dark},${bar.light})`,borderRadius:4,display:'flex',alignItems:'center',paddingLeft:8,fontSize:10,color:'rgba(255,255,255,.8)',fontWeight:700,transition:'width .6s'}}>
                      {bar.val>0?fmtMoney(bar.val):''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {modal&&(
        <Modal title={modal==='entrada'?'Nova Entrada':'Nova Saída'} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant={modal==='entrada'?'green':'red'} onClick={save}>{modal==='entrada'?'Salvar Entrada':'Salvar Saída'}</Btn>]}>
          <Field label="Descrição *"><input value={form.desc||''} onChange={f('desc')} placeholder={modal==='entrada'?'Ex: Pagamento João — armário':'Ex: Compra de MDF'}/></Field>
          <Row2>
            <Field label="Valor (R$) *"><input type="number" value={form.valor||''} onChange={f('valor')} placeholder="0,00"/></Field>
            <Field label="Data *"><input type="date" value={form.data||today()} onChange={f('data')}/></Field>
          </Row2>
          {modal==='saida'&&<Field label="Natureza do custo"><select value={form.natureza||'variavel'} onChange={f('natureza')}><option value="variavel">Custo Variável</option><option value="fixo">Custo Fixo</option></select></Field>}
          <Field label="Categoria"><select value={form.cat||''} onChange={f('cat')}><option value="">— Selecionar —</option>{catOptions.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
        </Modal>
      )}
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardPage({servicos,orcamentos,caixa,compromissos}){
  const emProd=servicos.filter(s=>s.status==='producao').length
  const entregues=servicos.filter(s=>s.status==='entregue').length
  const totalPendente=servicos.filter(s=>s.status!=='cancelado').reduce((a,s)=>a+saldoPendente(s),0)
  const saldo=caixa.reduce((a,c)=>c.tipo==='entrada'?a+c.valor:a-c.valor,0)
  const mes=currentMonth()
  const mesEnt=caixa.filter(c=>c.tipo==='entrada'&&c.data?.startsWith(mes)).reduce((a,c)=>a+c.valor,0)
  const mesFix=caixa.filter(c=>c.tipo==='saida'&&c.natureza==='fixo'&&c.data?.startsWith(mes)).reduce((a,c)=>a+c.valor,0)
  const mesVar=caixa.filter(c=>c.tipo==='saida'&&c.natureza==='variavel'&&c.data?.startsWith(mes)).reduce((a,c)=>a+c.valor,0)
  const lucro=mesEnt-mesFix-mesVar
  const abertos=servicos.filter(s=>s.status!=='cancelado'&&saldoPendente(s)>0).slice(0,6)
  const hojeComps=compromissos.filter(c=>c.data===today()&&!c.feito).sort((a,b)=>(a.hora||'').localeCompare(b.hora||''))
  const proximosComps=compromissos.filter(c=>c.data>today()&&!c.feito).sort((a,b)=>a.data.localeCompare(b.data)).slice(0,4)
  const dateStr=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  return(
    <div>
      <div style={{background:'linear-gradient(135deg,#28211a,rgba(139,78,31,.12))',border:'1px solid #3a2e20',borderRadius:10,padding:'20px 24px',marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:22,color:'#e8dcc8',fontStyle:'italic'}}>Bom dia! 🪚</div>
          <div style={{fontSize:12,color:'#7a6a55',marginTop:4}}>Sistema compartilhado — dados em tempo real para a equipe.</div>
        </div>
        <div style={{fontSize:12,color:'#d4a030'}}>{dateStr}</div>
      </div>
      <Grid cols={200}>
        <StatCard label="Em Produção" value={emProd} sub="serviços ativos" accent="#f0c040"/>
        <StatCard label="Entregues" value={entregues} sub="serviços concluídos" accent="#5db872"/>
        <StatCard label="A receber" value={fmtMoney(totalPendente)} sub="saldo pendente real" accent="#5dade2"/>
        <StatCard label="Saldo caixa" value={fmtMoney(saldo)} sub="histórico geral" accent={saldo>=0?'#5db872':'#e05545'}/>
      </Grid>
      <div style={{height:1,background:'#3a2e20',margin:'20px 0'}}/>
      <Grid cols={300}>
        <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,padding:20}}>
          <div style={{fontWeight:700,color:'#e8dcc8',marginBottom:16,fontSize:13}}>📊 Resultado do mês</div>
          {[{label:'Receita',value:mesEnt,color:'#5db872'},{label:'Custo fixo',value:mesFix,color:'#e05545'},{label:'Custo variável',value:mesVar,color:'#f0a040'},{label:'Lucro líquido',value:lucro,color:lucro>=0?'#5db872':'#e05545',bold:true}].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #3a2e20'}}>
              <span style={{color:r.bold?'#e8dcc8':'#a09080',fontWeight:r.bold?700:400,fontSize:r.bold?14:13}}>{r.label}</span>
              <span style={{color:r.color,fontWeight:700,fontFamily:'Georgia,serif',fontStyle:'italic',fontSize:r.bold?15:13}}>{fmtMoney(r.value)}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,padding:20}}>
          <div style={{fontWeight:700,color:'#e8dcc8',marginBottom:16,fontSize:13}}>💰 A receber por serviço</div>
          {abertos.length===0&&<div style={{color:'#7a6a55',fontStyle:'italic',fontSize:12}}>Nenhum valor pendente. 🎉</div>}
          {abertos.map(s=>{
            const cfg=STATUS_CFG[s.status];const pend=saldoPendente(s)
            return(
              <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #3a2e20',gap:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>{s.cliente}</div>
                  <div style={{fontSize:11,color:'#7a6a55'}}>{s.desc?.slice(0,35)}{s.desc?.length>35?'...':''}</div>
                  <Badge color={cfg.color} bg={cfg.bg} border={cfg.border}>{cfg.label}</Badge>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{color:'#f0a040',fontWeight:700,fontSize:14,fontFamily:'Georgia,serif',fontStyle:'italic'}}>{fmtMoney(pend)}</div>
                  {s.prazoEntrega&&<div style={{fontSize:10,color:'#7a6a55'}}>até {fmtDate(s.prazoEntrega)}</div>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{background:'#1e1812',border:'1px solid #3a2e20',borderRadius:10,padding:20}}>
          {hojeComps.length>0&&(
            <>
              <div style={{fontWeight:700,color:'#e8dcc8',marginBottom:12,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                📅 Hoje
                <span style={{background:'#e05545',color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:11}}>{hojeComps.length}</span>
              </div>
              {hojeComps.map(c=>{
                const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
                return(
                  <div key={c.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'7px 0',borderBottom:'1px solid #3a2e20',background:'rgba(212,160,48,.05)',borderRadius:6,paddingLeft:8,marginBottom:4}}>
                    <span style={{fontSize:16}}>{cfg.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:'#e8dcc8'}}>{c.titulo}</div>
                      {c.cliente&&<div style={{fontSize:11,color:'#a07040'}}>{c.cliente}</div>}
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {c.hora&&<div style={{color:'#d4a030',fontSize:12,fontWeight:700}}>{c.hora}</div>}
                      {c.local&&<div style={{fontSize:10,color:'#7a6a55'}}>📍 {c.local}</div>}
                    </div>
                  </div>
                )
              })}
              <div style={{height:1,background:'#3a2e20',margin:'12px 0'}}/>
            </>
          )}
          <div style={{fontWeight:700,color:'#e8dcc8',marginBottom:12,fontSize:13}}>📌 Próximos compromissos</div>
          {proximosComps.length===0&&hojeComps.length===0&&<div style={{color:'#7a6a55',fontStyle:'italic',fontSize:12}}>Nenhum compromisso agendado.</div>}
          {proximosComps.length===0&&hojeComps.length>0&&<div style={{color:'#7a6a55',fontStyle:'italic',fontSize:12}}>Nenhum compromisso futuro.</div>}
          {proximosComps.map(c=>{
            const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
            return(
              <div key={c.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:'1px solid #3a2e20'}}>
                <span style={{fontSize:18}}>{cfg.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{c.titulo}</div>
                  {c.cliente&&<div style={{fontSize:11,color:'#a07040'}}>{c.cliente}</div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{color:'#d4a030',fontSize:12,fontWeight:700}}>{fmtDate(c.data)}</div>
                  {c.hora&&<div style={{fontSize:11,color:'#7a6a55'}}>{c.hora}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </Grid>
    </div>
  )
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState('dashboard')
  const [servicos,setServicos]=useState([])
  const [orcamentos,setOrcamentos]=useState([])
  const [caixa,setCaixa]=useState([])
  const [compromissos,setCompromissos]=useState([])
  const [loading,setLoading]=useState(true)
  const [lastSync,setLastSync]=useState(null)

  const reload=useCallback(async()=>{
    const [s,o,c,comp]=await Promise.all([api.get('servicos'),api.get('orcamentos'),api.get('caixa'),api.get('compromissos')])
    setServicos(s);setOrcamentos(o);setCaixa(c);setCompromissos(comp)
    setLastSync(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))
  },[])

  useEffect(()=>{reload().then(()=>setLoading(false))},[reload])
  useEffect(()=>{const t=setInterval(reload,30000);return()=>clearInterval(t)},[reload])

  const hojeTem=compromissos.filter(c=>c.data===today()&&!c.feito).length
  const PAGES=[['dashboard','Dashboard'],['servicos','Serviços'],['orcamentos','Orçamentos'],['caixa','Caixa'],['compromissos','Compromissos']]

  return(
    <div style={{minHeight:'100vh',background:'#16120e',color:'#e8dcc8',fontFamily:'Georgia,serif',fontSize:14}}>
      <nav style={{background:'#1e1812',borderBottom:'1px solid #3a2e20',display:'flex',alignItems:'center',padding:'0 16px',position:'sticky',top:0,zIndex:100,overflowX:'auto'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:17,color:'#d4a030',padding:'14px 20px 14px 0',borderRight:'1px solid #3a2e20',marginRight:8,whiteSpace:'nowrap',fontWeight:'bold',fontStyle:'italic'}}>🪵 Marcenaria</div>
        {PAGES.map(([id,lbl])=>(
          <button key={id} onClick={()=>setPage(id)} style={{padding:'14px 14px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.06em',textTransform:'uppercase',background:'none',border:'none',borderBottom:`2px solid ${page===id?'#d4a030':'transparent'}`,color:page===id?'#d4a030':'#7a6a55',transition:'all .2s',whiteSpace:'nowrap',position:'relative'}}>
            {lbl}
            {id==='compromissos'&&hojeTem>0&&<span style={{position:'absolute',top:8,right:2,background:'#e05545',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{hojeTem}</span>}
          </button>
        ))}
        <div style={{marginLeft:'auto',fontSize:10,color:'#5a4a35',paddingLeft:16,whiteSpace:'nowrap'}}>{lastSync?`🔄 ${lastSync}`:'…'}</div>
      </nav>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 16px'}}>
        {loading?<div style={{textAlign:'center',padding:64,color:'#7a6a55'}}>Carregando dados…</div>:(
          <>
            {page==='dashboard'    &&<DashboardPage servicos={servicos} orcamentos={orcamentos} caixa={caixa} compromissos={compromissos}/>}
            {page==='servicos'     &&<ServicosPage servicos={servicos} reload={reload}/>}
            {page==='orcamentos'   &&<OrcamentosPage orcamentos={orcamentos} reload={reload}/>}
            {page==='caixa'        &&<CaixaPage caixa={caixa} reload={reload}/>}
            {page==='compromissos' &&<CompromissosPage compromissos={compromissos} reload={reload}/>}
          </>
        )}
      </div>
      <Toast/>
    </div>
  )
}
