import { NextResponse } from 'next/server'
import { getList, setList, KEYS } from '../../../lib/kv'

export async function GET() {
  const data = await getList(KEYS.compromissos)
  return NextResponse.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const list = await getList(KEYS.compromissos)
  const next = [body, ...list]
  await setList(KEYS.compromissos, next)
  return NextResponse.json(next)
}

export async function PUT(req) {
  const body = await req.json()
  const list = await getList(KEYS.compromissos)
  const next = list.map(c => c.id === body.id ? body : c)
  await setList(KEYS.compromissos, next)
  return NextResponse.json(next)
}

export async function DELETE(req) {
  const { id } = await req.json()
  const list = await getList(KEYS.compromissos)
  const next = list.filter(c => c.id !== id)
  await setList(KEYS.compromissos, next)
  return NextResponse.json(next)
}
