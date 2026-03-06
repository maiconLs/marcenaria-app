'use client'
import { useState, useEffect, useCallback } from 'react'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = d => { if (!d) return '—'; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}` }
const fmtMoney = v => 'R$ ' + parseFloat(v||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })
const currentMonth = () => new Date().toISOString().slice(0, 7)
const saldoPendente = s => Math.max(0, (parseFloat(s.valor)||0) - (parseFloat(s.sinal)||0) - (parseFloat(s.valorPago)||0))

// ── PALETA CLARA ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#f5f3ef',   // fundo geral
  surface:   '#ffffff',   // cards/panels
  surface2:  '#f0ede8',   // fundo alternativo suave
  border:    '#ddd8cf',   // bordas
  border2:   '#e8e3da',   // bordas suaves
  text:      '#2c2416',   // texto principal
  textMid:   '#6b5e4a',   // texto secundário
  textSoft:  '#9e8f7a',   // texto suave
  gold:      '#b07d20',   // dourado principal
  goldBg:    '#fdf3dc',   // fundo dourado suave
  green:     '#2e7d4f',   // verde
  greenBg:   '#e8f5ed',   // fundo verde
  red:       '#b83232',   // vermelho
  redBg:     '#fdeaea',   // fundo vermelho
  blue:      '#2563a8',   // azul
  blueBg:    '#e8f0fb',   // fundo azul
  yellow:    '#a06010',   // amarelo/laranja
  yellowBg:  '#fef3e2',   // fundo amarelo
  nav:       '#2c2416',   // nav escura
  navText:   '#e8dcc8',   // texto nav
  navSoft:   '#9e8a6a',   // texto nav suave
}

const MARCENEIROS = ['Maicon', 'Victor', 'Carlos', 'Daniel']
const STATUS_CFG = {
  orcamento: { label:'Orçamento',   color:C.blue,   bg:C.blueBg,   border:'#bcd0f0' },
  producao:  { label:'Em Produção', color:C.yellow, bg:C.yellowBg, border:'#f0d898' },
  entregue:  { label:'Entregue',    color:C.green,  bg:C.greenBg,  border:'#a8dab8' },
  cancelado: { label:'Cancelado',   color:C.red,    bg:C.redBg,    border:'#f0b8b8' },
}
const ORC_STATUS = {
  enviado:    { label:'Enviado',    color:C.blue   },
  aprovado:   { label:'Aprovado ✓', color:C.green  },
  recusado:   { label:'Recusado',   color:C.red    },
  aguardando: { label:'Aguardando', color:C.yellow },
}
const COMP_TIPOS = {
  reuniao: { label:'Reunião', color:C.blue,  icon:'🤝' },
  entrega: { label:'Entrega', color:C.green, icon:'🚚' },
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
  useEffect(()=>{ _toast=(m,color=C.green)=>{setMsg({m,color});setTimeout(()=>setMsg(null),2800)} },[])
  if(!msg)return null
  return <div style={{position:'fixed',bottom:24,right:24,background:C.surface,border:`1px solid ${C.border}`,borderLeft:`3px solid ${msg.color}`,borderRadius:9,padding:'10px 16px',color:C.text,fontSize:13,zIndex:999,boxShadow:'0 4px 20px rgba(0,0,0,.12)',fontFamily:'Georgia,serif'}}>{msg.m}</div>
}

const Label = ({children}) => <label style={{display:'block',fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:C.textMid,marginBottom:5,fontWeight:700}}>{children}</label>
const Field = ({label,children}) => <div style={{marginBottom:14}}>{label&&<Label>{label}</Label>}{children}</div>
const Row2  = ({children}) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{children}</div>

const Btn = ({variant='ghost',sm,onClick,children,style={}}) => {
  const base={padding:sm?'6px 12px':'9px 20px',borderRadius:7,cursor:'pointer',fontSize:sm?12:13,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.03em',border:'none',transition:'all .15s',lineHeight:1.2}
  const vars={
    gold:  {background:C.gold,  color:'#fff'},
    ghost: {background:'transparent',color:C.textMid,border:`1px solid ${C.border}`},
    green: {background:C.green, color:'#fff'},
    red:   {background:C.red,   color:'#fff'},
    blue:  {background:C.blue,  color:'#fff'},
  }
  return <button style={{...base,...(vars[variant]||vars.ghost),...style}} onClick={onClick}>{children}</button>
}

const Badge = ({color,bg,border,children}) => <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,color,background:bg||color+'18',border:`1px solid ${border||color+'44'}`,whiteSpace:'nowrap'}}>{children}</span>

const StatCard = ({label,value,sub,accent,accentBg}) => (
  <div style={{background:accentBg||C.surface,border:`1px solid ${C.border}`,borderLeft:`3px solid ${accent}`,borderRadius:10,padding:'16px 18px'}}>
    <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:C.textMid,marginBottom:6}}>{label}</div>
    <div style={{fontFamily:'Georgia,serif',fontSize:24,color:accent,fontStyle:'italic',fontWeight:700}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:C.textSoft,marginTop:4}}>{sub}</div>}
  </div>
)

const Grid = ({cols=220,children,style={}}) => <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${cols}px,1fr))`,gap:14,...style}}>{children}</div>

const Modal = ({title,onClose,children,footer}) => (
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(3px)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:24,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,.15)'}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:20,color:C.text,fontStyle:'italic',marginBottom:20,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>{title}</div>
      {children}
      {footer&&<div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>{footer}</div>}
    </div>
  </div>
)

// Global input/select styles injected once
const inputStyle = {background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:'8px 12px',color:C.text,fontSize:13,width:'100%',boxSizing:'border-box',fontFamily:'Georgia,serif',outline:'none'}

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
    if(!form.cliente?.trim()||!form.desc?.trim()){_toast?.('Preencha cliente e descrição.',C.red);return}
    setSaving(true)
    const prev=servicos.find(s=>s.id===form.id)
    const prevSinal=parseFloat(prev?.sinal||0)
    const newSinal=parseFloat(form.sinal||0)
    const dataSinal=form.dataSinal||today()
    if(modal==='edit'){
      await api.put('servicos',form)
      if(newSinal>prevSinal){
        const diff=newSinal-prevSinal
        await api.post('caixa',{id:uid(),tipo:'entrada',cat:'Sinal recebido',desc:`Sinal — ${form.cliente}`,valor:diff,data:dataSinal,natureza:'variavel',servicoId:form.id})
      }
      _toast?.('Serviço atualizado ✓')
    } else {
      const novo={...form,id:uid()}
      await api.post('servicos',novo)
      if(newSinal>0) await api.post('caixa',{id:uid(),tipo:'entrada',cat:'Sinal recebido',desc:`Sinal — ${form.cliente}`,valor:newSinal,data:dataSinal,natureza:'variavel',servicoId:novo.id})
      _toast?.('Serviço adicionado ✓')
    }
    await reload();setSaving(false);setModal(null)
  }

  const salvarPagamento=async()=>{
    const valor=parseFloat(pagForm.valor)
    if(!valor||!pagForm.data){_toast?.('Informe valor e data.',C.red);return}
    const s=servicos.find(x=>x.id===pagForm.servicoId)
    if(!s)return
    if(valor>saldoPendente(s)+0.01){_toast?.(`Valor maior que o pendente (${fmtMoney(saldoPendente(s))}).`,C.red);return}
    const novoValorPago=(parseFloat(s.valorPago)||0)+valor
    await api.put('servicos',{...s,valorPago:novoValorPago,dataPagamento:pagForm.data})
    await api.post('caixa',{id:uid(),tipo:'entrada',cat:'Pagamento final',desc:`Pagamento — ${s.cliente}`,valor,data:pagForm.data,natureza:'variavel',servicoId:s.id})
    await reload();_toast?.('Pagamento registrado e lançado no caixa ✓');setModal(null)
  }

  const del=async id=>{
    if(!confirm('Remover este serviço?'))return
    await api.delete('servicos',{id});await reload();_toast?.('Removido.',C.red)
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:C.text}}>Serviços</div>
          <div style={{fontSize:12,color:C.textSoft,marginTop:4}}>Acompanhe todos os trabalhos por status.</div>
        </div>
        <Btn variant="gold" onClick={openNew}>+ Novo Serviço</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
        {Object.entries(STATUS_CFG).map(([status,cfg])=>{
          const items=servicos.filter(s=>s.status===status)
          return(
            <div key={status} style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:`3px solid ${cfg.color}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700,color:cfg.color,borderBottom:`1px solid ${C.border}`,background:cfg.bg}}>
                <span>{cfg.label}</span><span style={{background:C.surface,borderRadius:20,padding:'1px 8px',color:C.textMid}}>{items.length}</span>
              </div>
              <div style={{padding:10,minHeight:60}}>
                {items.length===0&&<div style={{color:C.textSoft,fontSize:12,fontStyle:'italic',textAlign:'center',padding:'12px 0'}}>Nenhum serviço</div>}
                {items.map(s=>{
                  const pend=saldoPendente(s)
                  const quitado=pend<=0&&(s.valor||0)>0
                  return(
                    <div key={s.id} onClick={()=>openEdit(s)} style={{background:C.surface2,border:`1px solid ${C.border}`,borderLeft:`3px solid ${cfg.color}`,borderRadius:8,padding:'10px 12px',cursor:'pointer',marginBottom:8}}>
                      <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:4}}>{s.cliente}</div>
                      <div style={{fontSize:11,color:C.textMid,lineHeight:1.6,marginBottom:4}}>
                        {s.desc?.slice(0,50)}{s.desc?.length>50?'...':''}<br/>
                        {s.marceneiro&&<span style={{color:C.gold}}>🪚 {s.marceneiro}<br/></span>}
                      </div>
                      {s.valor>0&&(
                        <div style={{fontSize:11,background:C.surface,borderRadius:6,padding:'5px 8px',marginBottom:6,border:`1px solid ${C.border2}`}}>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.textSoft}}>Total</span><span style={{color:C.gold,fontWeight:700}}>{fmtMoney(s.valor)}</span></div>
                          {s.sinal>0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.textSoft}}>Sinal</span><span style={{color:C.green}}>{'- '}{fmtMoney(s.sinal)}</span></div>}
                          {s.valorPago>0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.textSoft}}>Pago</span><span style={{color:C.green}}>{'- '}{fmtMoney(s.valorPago)}</span></div>}
                          <div style={{display:'flex',justifyContent:'space-between',borderTop:`1px solid ${C.border}`,marginTop:3,paddingTop:3}}>
                            <span style={{color:C.textSoft}}>Pendente</span>
                            <span style={{color:quitado?C.green:C.yellow,fontWeight:700}}>{quitado?'✓ Quitado':fmtMoney(pend)}</span>
                          </div>
                        </div>
                      )}
                      {s.prazoEntrega&&<div style={{fontSize:10,color:C.textSoft,marginBottom:6}}>📅 Entrega: {fmtDate(s.prazoEntrega)}</div>}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6,gap:6}}>
                        {!quitado&&pend>0?<Btn variant="green" sm onClick={e=>{e.stopPropagation();openPagar(s)}}>💰 Registrar pagamento</Btn>:<span/>}
                        <Btn variant="ghost" sm onClick={e=>{e.stopPropagation();del(s.id)}}>Remover</Btn>
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
            <Field label="Cliente *"><input style={inputStyle} value={form.cliente||''} onChange={f('cliente')} placeholder="Nome do cliente"/></Field>
            <Field label="Status"><select style={inputStyle} value={form.status||'orcamento'} onChange={f('status')}>{Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
          </Row2>
          <Field label="Descrição *"><textarea style={{...inputStyle,minHeight:64,resize:'vertical'}} value={form.desc||''} onChange={f('desc')} placeholder="Ex: Armário 3 portas MDF branco..."/></Field>
          <Row2>
            <Field label="Valor total (R$)"><input style={inputStyle} type="number" value={form.valor||''} onChange={f('valor')} placeholder="0,00"/></Field>
            <Field label="Sinal recebido (R$)"><input style={inputStyle} type="number" value={form.sinal||''} onChange={f('sinal')} placeholder="0,00"/></Field>
          </Row2>
          <Field label="Data do sinal">
            <input style={inputStyle} type="date" value={form.dataSinal||today()} onChange={f('dataSinal')}/>
            <div style={{fontSize:11,color:C.textSoft,marginTop:4}}>Data que será lançada no fluxo de caixa</div>
          </Field>
          <Field label="Marceneiro responsável"><select style={inputStyle} value={form.marceneiro||''} onChange={f('marceneiro')}><option value="">{'— Selecionar —'}</option>{MARCENEIROS.map(m=><option key={m} value={m}>{m}</option>)}</select></Field>
          <Row2>
            <Field label="Início da produção"><input style={inputStyle} type="date" value={form.dataInicio||''} onChange={f('dataInicio')}/></Field>
            <Field label="Conclusão da produção"><input style={inputStyle} type="date" value={form.dataConclusao||''} onChange={f('dataConclusao')}/></Field>
          </Row2>
          <Field label="Prazo de entrega ao cliente"><input style={inputStyle} type="date" value={form.prazoEntrega||''} onChange={f('prazoEntrega')}/></Field>
          <Field label="Observações"><textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={form.obs||''} onChange={f('obs')} placeholder="Materiais, detalhes, contato..."/></Field>
        </Modal>
      )}

      {modal==='pagar'&&(
        <Modal title={`💰 Registrar Pagamento — ${pagForm.cliente}`} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant="green" onClick={salvarPagamento}>Confirmar Pagamento</Btn>]}>
          <div style={{background:C.yellowBg,borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,border:`1px solid #f0d898`}}>
            <span style={{color:C.textMid}}>Valor pendente: </span>
            <strong style={{color:C.yellow}}>{fmtMoney(pagForm.pendente)}</strong>
          </div>
          <Row2>
            <Field label="Valor recebido (R$) *"><input style={inputStyle} type="number" value={pagForm.valor||''} onChange={fp('valor')} placeholder="0,00"/></Field>
            <Field label="Data do pagamento *"><input style={inputStyle} type="date" value={pagForm.data||today()} onChange={fp('data')}/></Field>
          </Row2>
          <div style={{fontSize:11,color:C.textSoft,fontStyle:'italic'}}>Este valor será lançado automaticamente no fluxo de caixa como entrada.</div>
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
  const [abaOrc,setAbaOrc]=useState('mensal')
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}))

  const save=async()=>{
    if(!form.cliente?.trim()||!form.valor){_toast?.('Preencha cliente e valor.',C.red);return}
    if(modal?.id){await api.put('orcamentos',form);_toast?.('Atualizado ✓')}
    else{await api.post('orcamentos',{...form,id:uid()});_toast?.('Orçamento adicionado ✓')}
    await reload();setModal(null)
  }
  const del=async id=>{if(!confirm('Remover?'))return;await api.delete('orcamentos',{id});await reload();_toast?.('Removido.',C.red)}

  const total=orcamentos.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const aprovadosTotal=orcamentos.filter(o=>o.status==='aprovado')
  const totalAprovGeral=aprovadosTotal.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const taxaGeral=orcamentos.length?Math.round(aprovadosTotal.length/orcamentos.length*100):0
  const doMes=orcamentos.filter(o=>o.data?.startsWith(filtroMes))
  const totalMes=doMes.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const aprovMes=doMes.filter(o=>o.status==='aprovado')
  const totalAprovMes=aprovMes.reduce((a,o)=>a+parseFloat(o.valor||0),0)
  const taxaMes=doMes.length?Math.round(aprovMes.length/doMes.length*100):0
  const resumoStatus=Object.entries(ORC_STATUS).map(([k,v])=>{
    const items=doMes.filter(o=>o.status===k)
    return{key:k,...v,qtd:items.length,valor:items.reduce((a,o)=>a+parseFloat(o.valor||0),0)}
  }).filter(r=>r.qtd>0)
  const tableData=(abaOrc==='mensal'?doMes:orcamentos).filter(o=>o.cliente?.toLowerCase().includes(search.toLowerCase())||o.desc?.toLowerCase().includes(search.toLowerCase()))

  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div><div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:C.text}}>Orçamentos</div><div style={{fontSize:12,color:C.textSoft,marginTop:4}}>Controle de orçamentos e aprovações.</div></div>
        <Btn variant="gold" onClick={()=>{setForm({status:'enviado',data:today()});setModal({})}}>+ Novo Orçamento</Btn>
      </div>
      <Grid cols={200} style={{marginBottom:20}}>
        <StatCard label="Total orçado (geral)" value={fmtMoney(total)} sub={`${orcamentos.length} orçamentos`} accent={C.gold} accentBg={C.goldBg}/>
        <StatCard label="Aprovados (geral)" value={fmtMoney(totalAprovGeral)} sub={`${aprovadosTotal.length} aprovados`} accent={C.green} accentBg={C.greenBg}/>
        <StatCard label="Conversão (geral)" value={`${taxaGeral}%`} sub="histórico total" accent={C.blue} accentBg={C.blueBg}/>
      </Grid>
      <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:16,alignItems:'center',gap:0}}>
        {[['mensal','📅 Resumo do mês'],['todos','📋 Todos']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setAbaOrc(id)} style={{padding:'10px 16px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.04em',textTransform:'uppercase',background:'none',border:'none',borderBottom:`2px solid ${abaOrc===id?C.gold:'transparent'}`,color:abaOrc===id?C.gold:C.textMid,transition:'all .2s'}}>{lbl}</button>
        ))}
        {abaOrc==='mensal'&&(
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,paddingBottom:8}}>
            <span style={{fontSize:12,color:C.textSoft}}>Mês:</span>
            <input type="month" style={{...inputStyle,width:155}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/>
          </div>
        )}
      </div>
      {abaOrc==='mensal'&&(
        <>
          <Grid cols={180} style={{marginBottom:16}}>
            <StatCard label="Orçado no mês" value={fmtMoney(totalMes)} sub={`${doMes.length} orçamentos`} accent={C.gold} accentBg={C.goldBg}/>
            <StatCard label="Aprovados no mês" value={fmtMoney(totalAprovMes)} sub={`${aprovMes.length} aprovados`} accent={C.green} accentBg={C.greenBg}/>
            <StatCard label="Conversão do mês" value={`${taxaMes}%`} sub={`${doMes.length} orçamentos`} accent={C.blue} accentBg={C.blueBg}/>
          </Grid>
          {resumoStatus.length>0&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:12,color:C.textMid,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Resumo por status</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
                {resumoStatus.map(r=>(
                  <div key={r.key} style={{background:r.color+'12',borderRadius:8,padding:'10px 14px',border:`1px solid ${r.color}30`}}>
                    <div style={{fontSize:11,color:r.color,fontWeight:700,marginBottom:4}}>{r.label}</div>
                    <div style={{fontSize:16,color:C.text,fontFamily:'Georgia,serif',fontStyle:'italic',fontWeight:700}}>{fmtMoney(r.valor)}</div>
                    <div style={{fontSize:11,color:C.textSoft,marginTop:2}}>{r.qtd} orçamento{r.qtd!==1?'s':''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:`1px solid ${C.border}`,flexWrap:'wrap',gap:10}}>
          <span style={{fontWeight:700,fontSize:13,color:C.text}}>{abaOrc==='mensal'?`Orçamentos de ${filtroMes}`:'Todos os orçamentos'}</span>
          <input style={{...inputStyle,width:200}} placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:C.surface2}}>{['Cliente','Descrição','Valor','Data','Status',''].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,textTransform:'uppercase',letterSpacing:'.06em',color:C.textMid,fontWeight:700,borderBottom:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
          <tbody>
            {tableData.length===0&&<tr><td colSpan={6} style={{textAlign:'center',color:C.textSoft,fontStyle:'italic',padding:'24px'}}>Nenhum orçamento.</td></tr>}
            {tableData.map(o=>{
              const cfg=ORC_STATUS[o.status]||ORC_STATUS.enviado
              return(
                <tr key={o.id} style={{cursor:'pointer',borderBottom:`1px solid ${C.border2}`}} onClick={()=>{setForm({...o});setModal({id:o.id})}}>
                  <td style={{padding:'10px 14px'}}><strong style={{color:C.text}}>{o.cliente}</strong></td>
                  <td style={{padding:'10px 14px',color:C.textMid,maxWidth:200}}>{o.desc?.slice(0,60)}{o.desc?.length>60?'...':''}</td>
                  <td style={{padding:'10px 14px'}}><strong style={{color:C.gold}}>{fmtMoney(o.valor)}</strong></td>
                  <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>{fmtDate(o.data)}</td>
                  <td style={{padding:'10px 14px'}}><Badge color={cfg.color}>{cfg.label}</Badge></td>
                  <td style={{padding:'10px 14px'}} onClick={e=>e.stopPropagation()}><Btn variant="ghost" sm onClick={()=>del(o.id)}>Remover</Btn></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
      {modal&&(
        <Modal title={modal.id?'Editar Orçamento':'Novo Orçamento'} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant="gold" onClick={save}>Salvar</Btn>]}>
          <Row2>
            <Field label="Cliente *"><input style={inputStyle} value={form.cliente||''} onChange={f('cliente')} placeholder="Nome do cliente"/></Field>
            <Field label="Data"><input style={inputStyle} type="date" value={form.data||today()} onChange={f('data')}/></Field>
          </Row2>
          <Field label="Descrição *"><textarea style={{...inputStyle,minHeight:64,resize:'vertical'}} value={form.desc||''} onChange={f('desc')} placeholder="O que o cliente quer?"/></Field>
          <Row2>
            <Field label="Valor orçado (R$) *"><input style={inputStyle} type="number" value={form.valor||''} onChange={f('valor')} placeholder="0,00"/></Field>
            <Field label="Status"><select style={inputStyle} value={form.status||'enviado'} onChange={f('status')}>{Object.entries(ORC_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
          </Row2>
          <Field label="Observações"><textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={form.obs||''} onChange={f('obs')} placeholder="Detalhes adicionais..."/></Field>
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
    if(!form.titulo?.trim()||!form.data){_toast?.('Preencha título e data.',C.red);return}
    if(modal?.id){await api.put('compromissos',form);_toast?.('Compromisso atualizado ✓')}
    else{await api.post('compromissos',{...form,id:uid()});_toast?.('Compromisso adicionado ✓')}
    await reload();setModal(null)
  }
  const del=async id=>{if(!confirm('Remover?'))return;await api.delete('compromissos',{id});await reload();_toast?.('Removido.',C.red)}
  const toggleFeito=async item=>{await api.put('compromissos',{...item,feito:!item.feito});await reload()}

  const doMes=compromissos.filter(c=>c.data?.startsWith(filtroMes)).sort((a,b)=>a.data.localeCompare(b.data))
  const porData=doMes.reduce((acc,c)=>{if(!acc[c.data])acc[c.data]=[];acc[c.data].push(c);return acc},{})
  const proximos=compromissos.filter(c=>c.data>=today()&&!c.feito).sort((a,b)=>a.data.localeCompare(b.data)).slice(0,3)

  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div><div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:C.text}}>Compromissos</div><div style={{fontSize:12,color:C.textSoft,marginTop:4}}>Reuniões com clientes e entregas agendadas.</div></div>
        <Btn variant="gold" onClick={()=>{setForm({tipo:'reuniao',data:today()});setModal({})}}>+ Novo Compromisso</Btn>
      </div>
      {proximos.length>0&&(
        <div style={{background:C.goldBg,border:`1px solid #e8cc80`,borderRadius:10,padding:16,marginBottom:20}}>
          <div style={{fontSize:12,textTransform:'uppercase',letterSpacing:'.08em',color:C.gold,fontWeight:700,marginBottom:12}}>📌 Próximos compromissos</div>
          {proximos.map(c=>{
            const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
            return(
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,fontSize:13,marginBottom:8}}>
                <span style={{fontSize:16}}>{cfg.icon}</span>
                <div><strong style={{color:C.text}}>{c.titulo}</strong>{c.cliente&&<span style={{color:C.textMid}}>{' \u2014 '}{c.cliente}</span>}</div>
                <div style={{marginLeft:'auto',color:C.gold,fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(c.data)}{c.hora?` às ${c.hora}`:''}</div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <span style={{fontSize:12,color:C.textSoft}}>Mês:</span>
        <input type="month" style={{...inputStyle,width:160}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/>
        <span style={{fontSize:12,color:C.textSoft}}>{doMes.length} compromisso{doMes.length!==1?'s':''}</span>
      </div>
      {Object.keys(porData).length===0&&(
        <div style={{textAlign:'center',color:C.textSoft,fontStyle:'italic',padding:'32px',background:C.surface,border:`1px solid ${C.border}`,borderRadius:10}}>Nenhum compromisso neste mês.</div>
      )}
      {Object.entries(porData).map(([data,items])=>(
        <div key={data} style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
            <div style={{background:C.gold,color:'#fff',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{fmtDate(data)}</div>
            <div style={{flex:1,height:1,background:C.border}}/>
          </div>
          {items.map(c=>{
            const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
            return(
              <div key={c.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`3px solid ${cfg.color}`,borderRadius:9,padding:'12px 16px',display:'flex',alignItems:'flex-start',gap:12,opacity:c.feito?.6:1,marginBottom:8}}>
                <span style={{fontSize:20,flexShrink:0}}>{cfg.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <strong style={{fontSize:14,color:c.feito?C.textSoft:C.text,textDecoration:c.feito?'line-through':'none'}}>{c.titulo}</strong>
                    <Badge color={cfg.color}>{cfg.label}</Badge>
                    {c.feito&&<Badge color={C.green}>✓ Concluído</Badge>}
                  </div>
                  {c.cliente&&<div style={{fontSize:12,color:C.gold,marginBottom:2}}>👤 {c.cliente}</div>}
                  {c.hora&&<div style={{fontSize:12,color:C.textMid,marginBottom:2}}>🕐 {c.hora}</div>}
                  {c.local&&<div style={{fontSize:12,color:C.textMid,marginBottom:2}}>📍 {c.local}</div>}
                  {c.obs&&<div style={{fontSize:12,color:C.textSoft,fontStyle:'italic',marginTop:4}}>{c.obs}</div>}
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0,flexWrap:'wrap'}}>
                  <Btn variant={c.feito?'ghost':'green'} sm onClick={()=>toggleFeito(c)}>{c.feito?'↩ Reabrir':'✓ Feito'}</Btn>
                  <Btn variant="ghost" sm onClick={()=>{setForm({...c});setModal({id:c.id})}}>Editar</Btn>
                  <Btn variant="ghost" sm onClick={()=>del(c.id)}>Remover</Btn>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      {modal&&(
        <Modal title={modal.id?'Editar Compromisso':'Novo Compromisso'} onClose={()=>setModal(null)}
          footer={[<Btn key="c" variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>,<Btn key="s" variant="gold" onClick={save}>Salvar</Btn>]}>
          <Field label="Tipo"><select style={inputStyle} value={form.tipo||'reuniao'} onChange={f('tipo')}>{Object.entries(COMP_TIPOS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Field>
          <Field label="Título *"><input style={inputStyle} value={form.titulo||''} onChange={f('titulo')} placeholder="Ex: Visita técnica João / Entrega armário Maria"/></Field>
          <Field label="Cliente"><input style={inputStyle} value={form.cliente||''} onChange={f('cliente')} placeholder="Nome do cliente"/></Field>
          <Row2>
            <Field label="Data *"><input style={inputStyle} type="date" value={form.data||today()} onChange={f('data')}/></Field>
            <Field label="Horário"><input style={inputStyle} type="time" value={form.hora||''} onChange={f('hora')}/></Field>
          </Row2>
          <Field label="Local / Endereço"><input style={inputStyle} value={form.local||''} onChange={f('local')} placeholder="Rua, bairro ou 'Na oficina'"/></Field>
          <Field label="Observações"><textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={form.obs||''} onChange={f('obs')} placeholder="Detalhes adicionais..."/></Field>
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
    if(!form.desc?.trim()||!form.valor||!form.data){_toast?.('Preencha todos os campos.',C.red);return}
    await api.post('caixa',{...form,id:uid(),valor:parseFloat(form.valor)})
    await reload();setModal(null)
    _toast?.(form.tipo==='entrada'?'Entrada registrada ✓':'Saída registrada ✓',form.tipo==='entrada'?C.green:C.red)
  }
  const del=async id=>{if(!confirm('Remover?'))return;await api.delete('caixa',{id});await reload();_toast?.('Removido.',C.red)}

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

  // categoria breakdown — apenas saídas
  const catBreakdown=(items,cats)=>cats.map(cat=>({cat,valor:items.filter(c=>c.cat===cat).reduce((a,c)=>a+c.valor,0),qtd:items.filter(c=>c.cat===cat).length})).filter(r=>r.valor>0)
  const mesSaiItems=caixa.filter(c=>c.tipo==='saida'&&c.data?.startsWith(filtroMes))
  const allSaiItems=caixa.filter(c=>c.tipo==='saida')

  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div><div style={{fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:C.text}}>Fluxo de Caixa</div><div style={{fontSize:12,color:C.textSoft,marginTop:4}}>Entradas, saídas, custos fixos e variáveis.</div></div>
        <div style={{display:'flex',gap:8}}><Btn variant="green" onClick={()=>openModal('entrada')}>+ Entrada</Btn><Btn variant="red" onClick={()=>openModal('saida')}>+ Saída</Btn></div>
      </div>
      <Grid cols={200} style={{marginBottom:20}}>
        <StatCard label="Total entradas" value={fmtMoney(totalEnt)} sub="histórico geral" accent={C.green} accentBg={C.greenBg}/>
        <StatCard label="Custos fixos" value={fmtMoney(totalFix)} sub="histórico geral" accent={C.red} accentBg={C.redBg}/>
        <StatCard label="Custos variáveis" value={fmtMoney(totalVar)} sub="histórico geral" accent={C.yellow} accentBg={C.yellowBg}/>
        <StatCard label="Saldo atual" value={fmtMoney(saldo)} sub="entradas menos saídas" accent={saldo>=0?C.green:C.red} accentBg={saldo>=0?C.greenBg:C.redBg}/>
      </Grid>
      <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:16,alignItems:'center',flexWrap:'wrap',gap:0}}>
        {[['movimentos','📋 Movimentos'],['categorias','🏷️ Categorias'],['dre','📊 DRE'],['grafico','📈 Gráfico']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setAba(id)} style={{padding:'10px 14px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.04em',textTransform:'uppercase',background:'none',border:'none',borderBottom:`2px solid ${aba===id?C.gold:'transparent'}`,color:aba===id?C.gold:C.textMid,transition:'all .2s',whiteSpace:'nowrap'}}>{lbl}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,paddingBottom:8}}>
          <span style={{fontSize:11,color:C.textSoft}}>Mês:</span>
          <input type="month" style={{...inputStyle,width:150}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/>
        </div>
      </div>

      {aba==='movimentos'&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:`1px solid ${C.border}`,flexWrap:'wrap',gap:10}}>
            <span style={{fontWeight:700,fontSize:13,color:C.text}}>Movimentações</span>
            <select style={{...inputStyle,width:140}} value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}><option value="">Todos</option><option value="entrada">Entradas</option><option value="saida">Saídas</option></select>
          </div>
          {/* Mobile cards */}
          <div style={{display:'none'}} className="mobile-list">
            {filtered.length===0&&<div style={{textAlign:'center',color:C.textSoft,fontStyle:'italic',padding:'24px'}}>Nenhuma movimentação.</div>}
            {filtered.map(c=>{
              const cor=c.tipo==='entrada'?C.green:c.natureza==='fixo'?C.red:C.yellow
              return(
                <div key={c.id} style={{padding:'12px 16px',borderBottom:`1px solid ${C.border2}`,display:'flex',alignItems:'center',gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                      <Badge color={cor}>{c.tipo==='entrada'?'↑ Entrada':'↓ Saída'}</Badge>
                      <span style={{fontSize:11,color:C.textSoft}}>{fmtDate(c.data)}</span>
                    </div>
                    <div style={{fontWeight:600,fontSize:13,color:C.text}}>{c.desc}</div>
                    <div style={{fontSize:11,color:C.textSoft}}>{c.cat}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontWeight:700,color:cor,fontSize:14}}>{fmtMoney(c.valor)}</div>
                    <Btn variant="ghost" sm onClick={()=>del(c.id)} style={{marginTop:4}}>Remover</Btn>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Desktop table */}
          <div style={{overflowX:'auto'}} className="desktop-table">
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{background:C.surface2}}>{['Data','Tipo','Natureza','Categoria','Descrição','Valor',''].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,textTransform:'uppercase',letterSpacing:'.06em',color:C.textMid,fontWeight:700,borderBottom:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:'center',color:C.textSoft,fontStyle:'italic',padding:'24px'}}>Nenhuma movimentação.</td></tr>}
                {filtered.map(c=>{const cor=c.tipo==='entrada'?C.green:c.natureza==='fixo'?C.red:C.yellow;return(
                  <tr key={c.id} style={{borderBottom:`1px solid ${C.border2}`}}>
                    <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>{fmtDate(c.data)}</td>
                    <td style={{padding:'10px 14px'}}><Badge color={cor}>{c.tipo==='entrada'?'↑ Entrada':'↓ Saída'}</Badge></td>
                    <td style={{padding:'10px 14px'}}><Badge color={C.textMid}>{c.natureza==='fixo'?'Fixo':'Variável'}</Badge></td>
                    <td style={{padding:'10px 14px',color:C.textMid,fontSize:12}}>{c.cat}</td>
                    <td style={{padding:'10px 14px',color:C.text}}>{c.desc}</td>
                    <td style={{padding:'10px 14px'}}><strong style={{color:cor}}>{fmtMoney(c.valor)}</strong></td>
                    <td style={{padding:'10px 14px'}}><Btn variant="ghost" sm onClick={()=>del(c.id)}>Remover</Btn></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba==='categorias'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {[
            {titulo:'Custos Fixos por categoria',items:mesSaiItems.filter(c=>c.natureza==='fixo'),allItems:allSaiItems.filter(c=>c.natureza==='fixo'),cor:C.red,cats:CAT_FIXO},
            {titulo:'Custos Variáveis por categoria',items:mesSaiItems.filter(c=>c.natureza==='variavel'),allItems:allSaiItems.filter(c=>c.natureza==='variavel'),cor:C.yellow,cats:CAT_VAR},
          ].map(grupo=>{
            const extraCats=['Outro','Frete / Entrega']
            const allCats=catBreakdown(grupo.allItems,grupo.cats.concat(extraCats))
            const mesCats=catBreakdown(grupo.items,grupo.cats.concat(extraCats))
            const mesTot=grupo.items.reduce((a,c)=>a+c.valor,0)
            const allTot=grupo.allItems.reduce((a,c)=>a+c.valor,0)
            const maxVal=Math.max(...allCats.map(c=>c.valor),1)
            if(allCats.length===0)return(
              <div key={grupo.titulo} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:24,textAlign:'center',color:C.textSoft,fontStyle:'italic'}}>Nenhuma saída em {grupo.titulo.toLowerCase()}.</div>
            )
            return(
              <div key={grupo.titulo} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:`1px solid ${C.border}`,flexWrap:'wrap',gap:8,background:grupo.cor+'0e'}}>
                  <span style={{fontWeight:700,fontSize:13,color:grupo.cor}}>{grupo.titulo}</span>
                  <div style={{display:'flex',gap:16,fontSize:12,flexWrap:'wrap'}}>
                    <span style={{color:C.textMid}}>Mês: <strong style={{color:grupo.cor}}>{fmtMoney(mesTot)}</strong></span>
                    <span style={{color:C.textMid}}>Total: <strong style={{color:C.text}}>{fmtMoney(allTot)}</strong></span>
                  </div>
                </div>
                <div style={{padding:16}}>
                  {allCats.map(r=>{
                    const mesCat=mesCats.find(m=>m.cat===r.cat)
                    return(
                      <div key={r.cat} style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12,flexWrap:'wrap',gap:4}}>
                          <span style={{color:C.text,fontWeight:600}}>{r.cat}</span>
                          <div style={{display:'flex',gap:16}}>
                            <span style={{color:C.textSoft}}>Mês: <strong style={{color:grupo.cor}}>{fmtMoney(mesCat?.valor||0)}</strong></span>
                            <span style={{color:C.textSoft}}>Total: <strong style={{color:C.text}}>{fmtMoney(r.valor)}</strong></span>
                          </div>
                        </div>
                        <div style={{background:C.surface2,borderRadius:4,height:14,overflow:'hidden',position:'relative',border:`1px solid ${C.border}`}}>
                          <div style={{position:'absolute',top:0,left:0,width:`${Math.round(r.valor/maxVal*100)}%`,height:'100%',background:grupo.cor+'25',borderRadius:4}}/>
                          {mesCat&&<div style={{position:'absolute',top:0,left:0,width:`${Math.round((mesCat.valor||0)/maxVal*100)}%`,height:'100%',background:grupo.cor,borderRadius:4,opacity:.7}}/>}
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

      {aba==='dre'&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:24}}>
          {[{label:'Receita Bruta',value:mesEnt,color:C.green,bold:true},{label:'( - ) Custos Variáveis',value:-mesVar,color:C.yellow},{label:'= Margem Bruta',value:margem,color:margem>=0?C.green:C.red,bold:true,border:true},{label:'( - ) Custos Fixos',value:-mesFix,color:C.red},{label:'= Lucro Líquido',value:lucro,color:lucro>=0?C.green:C.red,bold:true,big:true,border:true}].map((row,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:row.border?16:8,paddingBottom:8,borderTop:row.border?`1px solid ${C.border}`:'none',marginBottom:2}}>
              <span style={{fontSize:row.big?15:13,fontWeight:row.bold?700:400,color:row.bold?C.text:C.textMid}}>{row.label}</span>
              <span style={{fontSize:row.big?22:14,fontWeight:700,color:row.color,fontFamily:'Georgia,serif',fontStyle:'italic'}}>{fmtMoney(Math.abs(row.value))}</span>
            </div>
          ))}
          {mesEnt>0&&<div style={{marginTop:16,padding:'10px 14px',background:C.surface2,borderRadius:8,fontSize:12,color:C.textMid,border:`1px solid ${C.border}`}}>Margem líquida: <strong style={{color:lucro>=0?C.green:C.red}}>{Math.round(lucro/mesEnt*100)}%</strong> · Ponto de equilíbrio: <strong style={{color:C.gold}}>{fmtMoney(mesFix)}</strong></div>}
        </div>
      )}

      {aba==='grafico'&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:24}}>
          <div style={{marginBottom:16,fontSize:13,color:C.textMid}}>{'Últimos 6 meses \u2014 Entradas vs Custos'}</div>
          {months.map((m,i)=>(
            <div key={i} style={{marginBottom:18}}>
              <div style={{fontSize:11,color:C.textSoft,marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>{m.lbl}</div>
              {[{label:'Entrada',val:m.ent,cor:C.green},{label:'Fixo',val:m.fix,cor:C.red},{label:'Variável',val:m.vari,cor:C.yellow}].map(bar=>(
                <div key={bar.label} style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
                  <div style={{width:58,fontSize:10,color:bar.cor,textAlign:'right',fontWeight:600}}>{bar.label}</div>
                  <div style={{flex:1,background:C.surface2,borderRadius:4,height:18,overflow:'hidden',border:`1px solid ${C.border}`}}>
                    <div style={{width:`${Math.round(bar.val/maxBar*100)}%`,height:'100%',minWidth:bar.val>0?40:0,background:bar.cor,borderRadius:4,display:'flex',alignItems:'center',paddingLeft:8,fontSize:10,color:'#fff',fontWeight:700,opacity:.85}}>
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
          <Field label="Descrição *"><input style={inputStyle} value={form.desc||''} onChange={f('desc')} placeholder={modal==='entrada'?'Ex: Pagamento João':'Ex: Compra de MDF'}/></Field>
          <Row2>
            <Field label="Valor (R$) *"><input style={inputStyle} type="number" value={form.valor||''} onChange={f('valor')} placeholder="0,00"/></Field>
            <Field label="Data *"><input style={inputStyle} type="date" value={form.data||today()} onChange={f('data')}/></Field>
          </Row2>
          {modal==='saida'&&<Field label="Natureza do custo"><select style={inputStyle} value={form.natureza||'variavel'} onChange={f('natureza')}><option value="variavel">Custo Variável</option><option value="fixo">Custo Fixo</option></select></Field>}
          <Field label="Categoria"><select style={inputStyle} value={form.cat||''} onChange={f('cat')}><option value="">{'— Selecionar —'}</option>{catOptions.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
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
      <div style={{background:`linear-gradient(135deg,${C.goldBg},${C.surface})`,border:`1px solid #e0cc90`,borderRadius:10,padding:'20px 24px',marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:22,color:C.text,fontStyle:'italic'}}>Bom dia! 🪚</div>
          <div style={{fontSize:12,color:C.textMid,marginTop:4}}>{'Sistema compartilhado \u2014 dados em tempo real para a equipe.'}</div>
        </div>
        <div style={{fontSize:12,color:C.gold,fontWeight:700}}>{dateStr}</div>
      </div>
      <Grid cols={200}>
        <StatCard label="Em Produção" value={emProd} sub="serviços ativos" accent={C.yellow} accentBg={C.yellowBg}/>
        <StatCard label="Entregues" value={entregues} sub="serviços concluídos" accent={C.green} accentBg={C.greenBg}/>
        <StatCard label="A receber" value={fmtMoney(totalPendente)} sub="saldo pendente real" accent={C.blue} accentBg={C.blueBg}/>
        <StatCard label="Saldo caixa" value={fmtMoney(saldo)} sub="histórico geral" accent={saldo>=0?C.green:C.red} accentBg={saldo>=0?C.greenBg:C.redBg}/>
      </Grid>
      <div style={{height:1,background:C.border,margin:'20px 0'}}/>
      <Grid cols={300}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:16,fontSize:13}}>📊 Resultado do mês</div>
          {[{label:'Receita',value:mesEnt,color:C.green},{label:'Custo fixo',value:mesFix,color:C.red},{label:'Custo variável',value:mesVar,color:C.yellow},{label:'Lucro líquido',value:lucro,color:lucro>=0?C.green:C.red,bold:true}].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border2}`}}>
              <span style={{color:r.bold?C.text:C.textMid,fontWeight:r.bold?700:400,fontSize:r.bold?14:13}}>{r.label}</span>
              <span style={{color:r.color,fontWeight:700,fontFamily:'Georgia,serif',fontStyle:'italic',fontSize:r.bold?16:13}}>{fmtMoney(r.value)}</span>
            </div>
          ))}
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:16,fontSize:13}}>💰 A receber por serviço</div>
          {abertos.length===0&&<div style={{color:C.textSoft,fontStyle:'italic',fontSize:12}}>Nenhum valor pendente. 🎉</div>}
          {abertos.map(s=>{
            const cfg=STATUS_CFG[s.status];const pend=saldoPendente(s)
            return(
              <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border2}`,gap:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:C.text}}>{s.cliente}</div>
                  <div style={{fontSize:11,color:C.textSoft}}>{s.desc?.slice(0,35)}{s.desc?.length>35?'...':''}</div>
                  <Badge color={cfg.color} bg={cfg.bg} border={cfg.border}>{cfg.label}</Badge>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{color:C.yellow,fontWeight:700,fontSize:14,fontFamily:'Georgia,serif',fontStyle:'italic'}}>{fmtMoney(pend)}</div>
                  {s.prazoEntrega&&<div style={{fontSize:10,color:C.textSoft}}>até {fmtDate(s.prazoEntrega)}</div>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
          {hojeComps.length>0&&(
            <>
              <div style={{fontWeight:700,color:C.text,marginBottom:12,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                📅 Hoje
                <span style={{background:C.red,color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:11}}>{hojeComps.length}</span>
              </div>
              {hojeComps.map(c=>{
                const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
                return(
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',borderBottom:`1px solid ${C.border2}`,background:C.goldBg,borderRadius:6,marginBottom:4}}>
                    <span style={{fontSize:16}}>{cfg.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:C.text}}>{c.titulo}</div>
                      {c.cliente&&<div style={{fontSize:11,color:C.textMid}}>{c.cliente}</div>}
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {c.hora&&<div style={{color:C.gold,fontSize:12,fontWeight:700}}>{c.hora}</div>}
                      {c.local&&<div style={{fontSize:10,color:C.textSoft}}>📍 {c.local}</div>}
                    </div>
                  </div>
                )
              })}
              <div style={{height:1,background:C.border,margin:'12px 0'}}/>
            </>
          )}
          <div style={{fontWeight:700,color:C.text,marginBottom:12,fontSize:13}}>📌 Próximos compromissos</div>
          {proximosComps.length===0&&hojeComps.length===0&&<div style={{color:C.textSoft,fontStyle:'italic',fontSize:12}}>Nenhum compromisso agendado.</div>}
          {proximosComps.length===0&&hojeComps.length>0&&<div style={{color:C.textSoft,fontStyle:'italic',fontSize:12}}>Nenhum compromisso futuro.</div>}
          {proximosComps.map(c=>{
            const cfg=COMP_TIPOS[c.tipo]||COMP_TIPOS.reuniao
            return(
              <div key={c.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:`1px solid ${C.border2}`}}>
                <span style={{fontSize:18}}>{cfg.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.text}}>{c.titulo}</div>
                  {c.cliente&&<div style={{fontSize:11,color:C.gold}}>{c.cliente}</div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{color:C.gold,fontSize:12,fontWeight:700}}>{fmtDate(c.data)}</div>
                  {c.hora&&<div style={{fontSize:11,color:C.textSoft}}>{c.hora}</div>}
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
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:'Georgia,serif',fontSize:14}}>
      <style>{`
        input,select,textarea{font-family:Georgia,serif;outline:none;transition:border-color .15s;}
        input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px ${C.gold}22;}
        table{width:100%;border-collapse:collapse;font-size:13px;}
        @media(max-width:640px){
          .desktop-table{display:none!important;}
          .mobile-list{display:block!important;}
        }
        @media(min-width:641px){
          .desktop-table{display:block;}
          .mobile-list{display:none!important;}
        }
        button:hover{opacity:.85;}
      `}</style>
      <nav style={{background:C.nav,display:'flex',alignItems:'center',padding:'0 16px',position:'sticky',top:0,zIndex:100,overflowX:'auto',boxShadow:'0 2px 8px rgba(0,0,0,.2)'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:17,color:'#d4a030',padding:'14px 20px 14px 0',borderRight:'1px solid #4a3a28',marginRight:8,whiteSpace:'nowrap',fontWeight:'bold',fontStyle:'italic'}}>🪵 Marcenaria</div>
        {PAGES.map(([id,lbl])=>(
          <button key={id} onClick={()=>setPage(id)} style={{padding:'14px 14px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Georgia,serif',letterSpacing:'.06em',textTransform:'uppercase',background:'none',border:'none',borderBottom:`2px solid ${page===id?'#d4a030':'transparent'}`,color:page===id?'#d4a030':C.navSoft,transition:'all .2s',whiteSpace:'nowrap',position:'relative'}}>
            {lbl}
            {id==='compromissos'&&hojeTem>0&&<span style={{position:'absolute',top:8,right:2,background:C.red,color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{hojeTem}</span>}
          </button>
        ))}
        <div style={{marginLeft:'auto',fontSize:10,color:C.navSoft,paddingLeft:16,whiteSpace:'nowrap'}}>{lastSync?`🔄 ${lastSync}`:'...'}</div>
      </nav>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 16px'}}>
        {loading?<div style={{textAlign:'center',padding:64,color:C.textSoft}}>Carregando dados...</div>:(
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
