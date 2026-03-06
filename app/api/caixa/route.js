import { NextResponse } from 'next/server'
import { getList, setList, KEYS } from '../../../lib/kv'

const err = (e) => NextResponse.json({ error: String(e) }, { status: 500 })
const KEY = KEYS.caixa

export async function GET() {
  try { return NextResponse.json(await getList(KEY)) }
  catch (e) { return err(e) }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const next = [body, ...(await getList(KEY))]
    await setList(KEY, next)
    return NextResponse.json(next)
  } catch (e) { return err(e) }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const next = (await getList(KEY)).map(x => x.id === body.id ? body : x)
    await setList(KEY, next)
    return NextResponse.json(next)
  } catch (e) { return err(e) }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json()
    const next = (await getList(KEY)).filter(x => x.id !== id)
    await setList(KEY, next)
    return NextResponse.json(next)
  } catch (e) { return err(e) }
}
