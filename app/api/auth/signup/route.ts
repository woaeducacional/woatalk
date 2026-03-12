import { NextRequest, NextResponse } from 'next/server'
import { signUpSchema } from '@/lib/validation'
import { createUser, getUserByEmail } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = await signUpSchema.parseAsync(body)

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está registrado' },
        { status: 400 }
      )
    }

    // Create new user
    try {
      const user = await createUser(
        validatedData.email,
        validatedData.name,
        validatedData.password
      )

      return NextResponse.json(
        {
          message: 'User created successfully',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        { status: 201 }
      )
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          error: 'Erro ao criar usuário. Verifique as variáveis de ambiente.',
          isUsingFallback: true 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar cadastro',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
