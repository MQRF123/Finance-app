# 🏦 Finance App - Sistema de Gestión de Bonos Corporativos

Una aplicación web moderna desarrollada con **Next.js 15** y **TypeScript** para el cálculo, análisis y gestión de bonos corporativos utilizando el **método francés** de amortización.

## ✨ Características Principales

### � Sistema de Autenticación
- **Autenticación con Firebase**: Login seguro y gestión de sesiones
- **Roles de Usuario**: Emisores e Inversionistas con funcionalidades específicas
- **Protección de Rutas**: Acceso controlado según el tipo de usuario

### 📊 Gestión de Bonos
- **Creación de Bonos**: Formulario completo con validaciones en tiempo real
- **Validación de Nombres Únicos**: Previene la creación de bonos con nombres duplicados
- **Edición de Bonos**: Modificación de bonos existentes con validaciones
- **Listado y Filtrado**: Vista organizada de todos los bonos con filtros avanzados

### 🧮 Cálculos Financieros
- **Método Francés**: Cálculo de cuotas constantes con amortización creciente
- **TCEA (Tasa de Costo Efectivo Anual)**: Cálculo automático
- **TREA (Tasa de Rendimiento Efectivo Anual)**: Análisis de rentabilidad
- **Precio de Bonos**: Valoración basada en tasas de mercado
- **Flujos de Caja**: Generación detallada de cronogramas de pago

### 🎯 Períodos de Gracia
- **Gracia Estática**: Configuración tradicional de períodos sin pago
- **Gracia Dinámica**: Períodos de gracia variables por rangos específicos
- **Tipos de Gracia**: Sin gracia, parcial y total
- **Validaciones Automáticas**: Verificación de consistencia en configuraciones

### 📈 Análisis y Reportes
- **Análisis de Sensibilidad**: Evaluación de cambios en tasas de descuento
- **Comparación de Bonos**: Análisis lado a lado de múltiples instrumentos
- **Exportación a PDF**: Generación de reportes profesionales
- **Dashboard Interactivo**: Métricas y estadísticas en tiempo real

### 🎨 Interfaz de Usuario
- **Diseño Moderno**: Interface construida con Tailwind CSS y Radix UI
- **Responsive Design**: Optimizada para dispositivos móviles y desktop
- **Componentes Reutilizables**: Arquitectura modular con shadcn/ui
- **Experiencia Intuitiva**: Navegación fluida y feedback visual

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15**: Framework React con App Router
- **TypeScript**: Tipado estático para mayor seguridad
- **Tailwind CSS**: Framework CSS utilitario
- **Radix UI**: Componentes accesibles y customizables
- **React Hook Form**: Gestión eficiente de formularios
- **Zod**: Validación de esquemas TypeScript-first

### Backend & Base de Datos
- **Firebase**: 
  - Authentication (Autenticación)
  - Firestore (Base de datos NoSQL)
  - Hosting y despliegue

### Librerías Especializadas
- **jsPDF**: Generación de reportes PDF
- **Lucide React**: Iconografía moderna
- **Sonner**: Notificaciones toast elegantes

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── admin/             # Panel de administración
│   ├── bonos/             # Gestión de bonos
│   │   ├── analisis/      # Análisis financiero
│   │   ├── detail/        # Detalles de bonos
│   │   ├── edit/          # Edición de bonos
│   │   ├── list/          # Listado de bonos
│   │   └── register/      # Registro de nuevos bonos
│   ├── emisor/            # Dashboard del emisor
│   ├── inversionista/     # Dashboard del inversionista
│   └── login/             # Autenticación
├── components/            # Componentes reutilizables
│   ├── auth/              # Componentes de autenticación
│   ├── bonos/             # Componentes específicos de bonos
│   └── ui/                # Componentes base (shadcn/ui)
└── lib/                   # Utilidades y lógica de negocio
    ├── bono/              # Utilidades de bonos
    ├── calculations/      # Cálculos financieros
    └── firebase/          # Configuración de Firebase
```

## 🔢 Método Francés de Amortización

El sistema implementa el método francés con las siguientes características:

- **Cuotas Constantes**: Pagos uniformes durante toda la vida del bono
- **Amortización Creciente**: Capital pagado aumenta con cada período
- **Intereses Decrecientes**: Intereses disminuyen a medida que se amortiza
- **Fórmula Base**: Cálculo basado en anualidades y valor presente

### Fórmulas Implementadas

```
Cuota = VN × (r × (1 + r)^n) / ((1 + r)^n - 1)

Donde:
- VN = Valor Nominal
- r = Tasa efectiva por período
- n = Número total de períodos
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm, yarn, pnpm o bun
- Cuenta de Firebase

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone [url-del-repositorio]
cd finance-app
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar Firebase**
- Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
- Habilitar Authentication y Firestore
- Copiar la configuración a `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📱 Uso de la Aplicación

### Para Emisores
1. **Registro/Login**: Crear cuenta como emisor
2. **Crear Bonos**: Definir características financieras
3. **Configurar Gracia**: Establecer períodos de gracia si aplica
4. **Gestionar**: Editar y monitorear bonos emitidos

### Para Inversionistas
1. **Explorar Bonos**: Ver bonos disponibles en el mercado
2. **Analizar**: Comparar rentabilidades y riesgos
3. **Evaluar**: Usar herramientas de análisis de sensibilidad

## 🔧 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo con Turbopack
npm run build    # Construir para producción
npm run start    # Servidor de producción
npm run lint     # Linter ESLint
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a [Vercel](https://vercel.com)
2. Configurar variables de entorno
3. Despliegue automático

### Otras Plataformas
Compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Crear un [Issue](link-a-issues) en GitHub
- Documentación adicional en la [Wiki](link-a-wiki)

---

**Desarrollado con ❤️ para la gestión eficiente de bonos corporativos**
