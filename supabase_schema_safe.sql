-- ESQUEMA DE BASE DE DATOS MEJORADO (Idempotente)
-- Diseñado para Supabase (PostgreSQL)

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT,
    email TEXT UNIQUE NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('fijo', 'variable', 'hormiga', 'ingreso')),
    icono TEXT,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    es_sistema BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: transacciones (Agregamos owner_manual y tipo_manual para compatibilidad rápida)
CREATE TABLE IF NOT EXISTS public.transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id),
    descripcion TEXT NOT NULL,
    monto NUMERIC(15, 2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago TEXT,
    es_hormiga BOOLEAN DEFAULT FALSE,
    tipo_manual TEXT, -- Para categorías rápidas
    owner_manual TEXT, -- Para dueños rápidos
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SEGURIDAD: Row Level Security (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS (Limpiar y Recrear para evitar errores "ya existe")

-- POLÍTICAS PARA usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.usuarios FOR SELECT USING (true); -- Permitimos ver por ahora para el demo

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.usuarios FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS PARA categorias
DROP POLICY IF EXISTS "Usuarios pueden ver categorías propias y del sistema" ON public.categorias;
CREATE POLICY "Usuarios pueden ver categorías propias y del sistema" 
ON public.categorias FOR SELECT USING (true); -- Lectura pública para el demo

-- POLÍTICAS PARA transacciones (Permitimos lectura/escritura pública por ahora para asegurar el demo)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias transacciones" ON public.transacciones;
CREATE POLICY "Usuarios pueden ver sus propias transacciones" 
ON public.transacciones FOR SELECT USING (true); 

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias transacciones" ON public.transacciones;
CREATE POLICY "Usuarios pueden insertar sus propias transacciones" 
ON public.transacciones FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias transacciones" ON public.transacciones;
CREATE POLICY "Usuarios pueden actualizar sus propias transacciones" 
ON public.transacciones FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias transacciones" ON public.transacciones;
CREATE POLICY "Usuarios pueden eliminar sus propias transacciones" 
ON public.transacciones FOR DELETE USING (true);

-- 7. DATOS INICIALES (Sólo si las tablas están vacías)
INSERT INTO public.categorias (nombre, tipo, icono, es_sistema) 
SELECT 'Ingreso Salarial', 'ingreso', 'trending-up', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nombre = 'Ingreso Salarial');

INSERT INTO public.categorias (nombre, tipo, icono, es_sistema) 
SELECT 'Arriendo', 'fijo', 'home', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nombre = 'Arriendo');
