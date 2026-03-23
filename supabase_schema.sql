-- ESQUEMA DE BASE DE DATOS PARA CONTROL FINANCIERO PERSONAL
-- Diseñado para Supabase (PostgreSQL)

-- 1. EXTENSIONES (Opcional, usualmente ya activas en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: usuarios
-- Se sincroniza con auth.users de Supabase
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
    icono TEXT, -- Guardar nombre del icono (ej. 'coffee', 'home')
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE, -- Categorías personalizadas por usuario
    es_sistema BOOLEAN DEFAULT FALSE, -- Para categorías predefinidas
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: transacciones
CREATE TABLE IF NOT EXISTS public.transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES public.categorias(id),
    descripcion TEXT NOT NULL,
    monto NUMERIC(15, 2) NOT NULL, -- Precisión decimal para dinero, prohibido FLOAT
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'debito', 'tc_visa', 'tc_falabella')),
    es_hormiga BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SEGURIDAD: Row Level Security (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.usuarios FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.usuarios FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS PARA categorias
CREATE POLICY "Usuarios pueden ver categorías propias y del sistema" 
ON public.categorias FOR SELECT USING (auth.uid() = usuario_id OR es_sistema = TRUE);

CREATE POLICY "Usuarios pueden insertar sus propias categorías" 
ON public.categorias FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden modificar sus propias categorías" 
ON public.categorias FOR ALL USING (auth.uid() = usuario_id);

-- POLÍTICAS PARA transacciones
CREATE POLICY "Usuarios pueden ver sus propias transacciones" 
ON public.transacciones FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden insertar sus propias transacciones" 
ON public.transacciones FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus propias transacciones" 
ON public.transacciones FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden eliminar sus propias transacciones" 
ON public.transacciones FOR DELETE USING (auth.uid() = usuario_id);

-- 6. DATOS INICIALES (CATEGORÍAS DE SISTEMA BASADAS EN EXCEL)
INSERT INTO public.categorias (nombre, tipo, icono, es_sistema) VALUES
('Ingreso Salarial', 'ingreso', 'trending-up', TRUE),
('Ingresos Extras', 'ingreso', 'plus-circle', TRUE),
('Arriendo/Administración', 'fijo', 'home', TRUE),
('Servicios Públicos', 'fijo', 'zap', TRUE),
('Mercado', 'variable', 'shopping-cart', TRUE),
('Gasolina/Transporte', 'variable', 'truck', TRUE),
('Tinto/Café', 'hormiga', 'coffee', TRUE),
('Dulces/Snacks', 'hormiga', 'pie-chart', TRUE),
('Uber/Didi', 'hormiga', 'navigation', TRUE);

-- 7. TRIGGERS PARA actualizado_en
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
