# HayTurno — Diagramas de Flujo y Arquitectura

## Flujo del usuario público

```mermaid
flowchart TD
    A["Cliente abre link o QR"] --> B["Pagina cola /b/:slug"]
    B --> C{"Barberia existe?"}
    C -->|No| D["404 Not Found"]
    C -->|Si| E["Ver cola actual"]
    E --> F{"Quiere unirse?"}
    F -->|No| E
    F -->|Si| G["Pagina unirse /b/:slug/join"]
    G --> H["Ingresa nombre"]
    H --> I{"Nombre valido?"}
    I -->|No| H
    I -->|Si| J["Enviar turno"]
    J --> K["Turno agregado a la cola"]
    K --> L["Volver a la cola"]
    L --> M["Espera su turno en tiempo real"]
```

## Flujo del admin

```mermaid
flowchart TD
    A["Admin abre /admin/:slug/queue"] --> B{"Tiene sesion?"}
    B -->|No| C["Pagina login"]
    B -->|Si| D{"Es miembro?"}
    C --> E["Ingresa email + password"]
    E --> F{"Credenciales validas?"}
    F -->|No| E
    F -->|Si| D
    D -->|No| G["Acceso denegado"]
    D -->|Si| H["Ver cola actual"]
    H --> I{"Accion"}
    I -->|Registrar walk-in| J["Formulario nombre"]
    J --> K["Crear turno walk-in"]
    K --> H
    I -->|Llamar siguiente| L["next_turn RPC"]
    L --> H
    I -->|Cancelar turno| M["cancelTurn"]
    M --> H
    I -->|Ver stats| N["Pagina stats"]
    N --> H
```

## Arquitectura del sistema

```mermaid
flowchart LR
    subgraph Browser["Navegador"]
        SPA["React SPA"]
        TQ["TanStack Query"]
        ZS["Zustand"]
    end

    subgraph Supabase
        AUTH["Auth"]
        REST["PostgREST API"]
        RT["Realtime"]
        DB[("PostgreSQL")]
    end

    SPA --> TQ
    SPA --> ZS
    TQ -->|"queries + mutations"| REST
    TQ -->|"subscribe"| RT
    REST --> DB
    RT -->|"changes"| DB
    AUTH -->|"session"| SPA
```

## Sincronizacion realtime

```mermaid
sequenceDiagram
    participant A as Admin Device 1
    participant S as Supabase Realtime
    participant DB as PostgreSQL
    participant C as Cliente Device 2

    A->>DB: callNextTurn RPC
    DB->>DB: UPDATE turns SET called
    DB->>S: Notify change
    S->>C: Realtime event
    C->>C: invalidateQueries
    C->>DB: Re-fetch queue
    C->>C: UI actualizada
```

## Flujos de datos

```mermaid
flowchart TB
    subgraph Hooks["Hooks"]
        UPQ["usePublicQueue"]
        UAQ["useAdminQueue"]
        UQR["useQueueRealtime"]
        UAS["useAttendedStats"]
        UAG["useAuthGuard"]
    end

    subgraph Services["Services"]
        BAR["barbershops.ts"]
        QUE["queue.ts"]
        AUT["auth.ts"]
        MEM["memberships.ts"]
        STA["stats.ts"]
        RTM["realtime.ts"]
    end

    subgraph DB["Database"]
        BT[("barbershops")]
        TU[("turns")]
        PR[("profiles")]
        BM[("memberships")]
    end

    UPQ --> BAR
    UPQ --> QUE
    UAQ --> QUE
    UQR --> RTM
    UAS --> STA
    UAG --> AUT
    UAG --> MEM

    BAR --> BT
    QUE --> TU
    AUT --> PR
    MEM --> BM
    STA --> TU
    RTM --> TU
```

## Estructura de navegacion

```mermaid
flowchart TD
    root["Raiz"] --> public["Cola publica"]
    root --> admin["Admin"]

    public --> queue["QueuePage"]
    public --> join["JoinPage"]
    public --> notfound["404 NotFoundPage"]

    admin --> login["LoginPage"]
    admin --> adminq["QueuePage"]
    admin --> stats["StatsPage"]

    login -->|"success"| adminq
    adminq --> stats
    adminq -->|"logout"| login
    stats -->|"back"| adminq
```
