-- ACTUALIZACIÓN DE ESQUEMA PARA MULTI-PERFIL (Laura, David, Familia)
-- Basado en la necesidad de separar y consolidar datos.

-- 1. AGREGAR COLUMNA DE PROPIETARIO A LAS TRANSACCIONES
-- Esto permite identificar de quién es cada registro o si es compartido.
ALTER TABLE public.transacciones 
ADD COLUMN IF NOT EXISTS propietario TEXT CHECK (propietario IN ('laura', 'david', 'familia')) DEFAULT 'familia';

-- 2. ACTUALIZAR CATEGORÍAS PARA PERMITIR FILTRADO POR PROPIETARIO (OPCIONAL)
-- Algunas categorías pueden ser solo de David o solo de Laura.
ALTER TABLE public.categorias 
ADD COLUMN IF NOT EXISTS propietario TEXT CHECK (propietario IN ('laura', 'david', 'todos')) DEFAULT 'todos';

-- 3. POLÍTICAS DE RLS ACTUALIZADAS PARA COMPARTIR DATOS
-- Si Laura y David están en el mismo grupo de familia, deberían poder ver los datos del otro.
-- Nota: En un entorno real, usaríamos una tabla 'miembros_familia'. 
-- Para este demo, permitiremos que si el propietario es 'familia', todos en el grupo lo vean.

-- Ejemplo de política para ver transacciones compartidas (simplificado):
-- CREATE POLICY "Usuarios pueden ver transacciones de su familia" 
-- ON public.transacciones FOR SELECT USING (true); -- Permitir ver todos para el demo consolidado.

-- 5. TABLA: presupuestos
CREATE TABLE IF NOT EXISTS public.presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID NOT NULL REFERENCES public.categorias(id),
    monto_tope NUMERIC(15, 2) NOT NULL,
    propietario TEXT CHECK (propietario IN ('laura', 'david', 'familia')) NOT NULL,
    mes_año DATE NOT NULL DEFAULT CURRENT_DATE, -- Para presupuestos mensuales
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SEGURIDAD: RLS PARA presupuestos
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver presupuestos propios y de familia" 
ON public.presupuestos FOR SELECT USING (auth.uid() = usuario_id OR propietario = 'familia');

CREATE POLICY "Usuarios pueden gestionar sus propios presupuestos" 
ON public.presupuestos FOR ALL USING (auth.uid() = usuario_id);

-- 7. INSERTAR DATOS DE PRUEBA DE PRESUPUESTOS (EJEMPLO)
/*
INSERT INTO public.presupuestos (categoria_id, monto_tope, propietario, usuario_id)
VALUES 
('id_cat_fijos', 2500000, 'familia', 'auth_id'),
('id_cat_hormiga', 100000, 'laura', 'auth_id_laura'),
('id_cat_hormiga', 150000, 'david', 'auth_id_david');
*/

