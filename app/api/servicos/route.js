import { NextResponse } from 'next/server'
import { getList, setList, KEYS } from '../../../lib/kv'

export async function GET() {
  const data = await getList(KEYS.servicos)
  return NextResponse.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const list = await getList(KEYS.servicos)
  const next = [body, ...list]
  await setList(KEYS.servicos, next)
  return NextResponse.json(next)
}

export async function PUT(req) {
  const body = await req.json()
  const list = await getList(KEYS.servicos)
  const next = list.map(s => s.id === body.id ? body : s)
  await setList(KEYS.servicos, next)
  return NextResponse.json(next)
}

export async function DELETE(req) {
  const { id } = await req.json()
  const list = await getList(KEYS.servicos)
  const next = list.filter(s => s.id !== id)
  await setList(KEYS.servicos, next)
  return NextResponse.json(next)
}
