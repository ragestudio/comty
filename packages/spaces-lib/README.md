# @comty/spaces-lib

@comty/spaces-lib is the core library responsible for state management, offline-first local persistence, and real-time synchronization for the Spaces feature in Comty.

---

## Key Features

- Reactive State Management: Built on top of Zustand to manage groups, channels, members, navigation, and messaging in a clean and decoupled way.
- Offline-First Storage: Uses Dexie (IndexedDB) to persist groups, channels, member lists, and message history locally for instant screen loads.
- Real-Time Synchronization: Listens to WebSocket events for incoming messages, channel changes, user presence updates, and WebRTC voice states.
- Unified Chat Engine: Single unified pipeline supporting both group channels and one-on-one direct messages (DMs).
- Smart Timeline and Pagination: Bi-directional pagination (load before, load after, load around a specific target) and support for pausing live updates during history scrolling.
- Reconnection Resilience: Automatically reconciles active voice connections and member presence states whenever network connectivity is restored.
- URL-Synced Navigation: Dedicated navigation store that keeps route state and browser URL parameters in sync.

---

## Requirements and Peer Dependencies

Ensure the following packages are installed in your project:

- @comty/shared
- comty.js
- dexie (^4)
- zustand (^5)

---

## Core Modules

### 1. Group Store (`useSpacesGroupStore`)

Manages all data and events for the active group or server:

- Group Data: Basic group info, settings, and avatars.
- Channels and Members: Structured channel hierarchies, user roles, and membership lists.
- WebRTC Voice State: Tracks connected voice participants, audio and video tracks, and producer lifecycle events.
- Presence and Cache: Tracks online and offline user status along with user profile decorations.

#### Available Hooks:

- `useGroupData()`: Returns active group details.
- `useGroupChannels()`: Returns channels grouped by category.
- `useGroupMembers()`: Returns the list of members and member counts.
- `useGroupRTC()`: Returns real-time voice channel states and connected participants.
- `useGroupActions()`: Returns methods to fetch, set, and reset group state.

---

### 2. Chat Store (`useSpacesChatStore`)

Handles timeline rendering, message delivery, read receipts, and typing indicators:

- Timeline State: Maintains an ordered list of rendered messages with deduplication.
- Chat Types: Supports both group channels (`group`) and direct messages (`dm`).
- Typing Indicators: Tracks active remote typers and broadcasts local typing status with debounce timeouts.
- Pagination Actions: `loadBefore`, `loadAfter`, and `loadAround` to fetch message history seamlessly.

#### Available Hooks:

- `useChatState()`: Returns timeline items, loading states, errors, and active typers.
- `useChatActions()`: Returns methods to initialize, send messages, synchronize, and reset chat sessions.

---

### 3. Navigation Store (`useSpacesNavigationStore`)

Manages the active view, room, channel, and subview inside Spaces, automatically syncing route transitions to the browser URL:

- `useSpacesNavigation()`: Returns current navigation targets and header registration utilities.
- `useNavigationActions()`: Returns navigation dispatchers like `navigate()`.

---

### 4. Local Database (`db`)

Central Dexie IndexedDB instance (`spaces_store`) containing the following tables:

- `groups`: Locally cached group entities.
- `channels`: Channels indexed by group.
- `members`: Member records indexed by group and user ID.
- `channel_messages`: Channel messages indexed by channel and message ID.
- `direct_messages`: Direct messages indexed by recipient and message ID.
- `chats_sync`: Synchronization timestamps and markers for incremental updates.

---

## How It Works

### Group Lifecycle Flow

1. Initialization: Call `actions.init(groupId)`.
2. Local Load: Group metadata, channels, and cached members are loaded immediately from IndexedDB.
3. Network Sync: Fresh data is fetched from the server API and written back to the local database.
4. Real-Time Events: Subscribe to socket topics with `subscribeGroupSocket(groupId)` to receive live updates.

```typescript
import { useEffect } from "react"
import { useSpacesGroupStore, subscribeGroupSocket } from "@comty/spaces-lib"

export function GroupView({ groupId }: { groupId: string }) {
  const { init, reset } = useSpacesGroupStore((s) => s.actions)

  useEffect(() => {
    init(groupId)
    const unsubscribe = subscribeGroupSocket(groupId)

    return () => {
      unsubscribe()
      reset()
    }
  }, [groupId])

  return <div>Group content view</div>
}
```

---

### Chat Lifecycle Flow

1. Session Setup: Call `actions.init({ type: "group", id: channelId })`.
2. Timeline Population: Recent messages are read from IndexedDB to populate the timeline.
3. Syncing Missed Messages: `sync()` runs in the background to fetch unread messages from the server.
4. Sending and Receiving: Outgoing messages are sent via `actions.send()`, while incoming socket events automatically append new items and persist them locally.

```typescript
import { useEffect } from "react"
import { useChatState, useChatActions, subscribeChatSocket } from "@comty/spaces-lib"

export function ChatView({ channelId }: { channelId: string }) {
  const { timeline, loading, usersTyping } = useChatState()
  const { init, send, reset } = useChatActions()

  useEffect(() => {
    init({ type: "group", id: channelId })
    const unsubscribe = subscribeChatSocket("group", channelId)

    return () => {
      unsubscribe()
      reset()
    }
  }, [channelId])

  const handleSendMessage = async (text: string) => {
    await send({ content: text })
  }

  return (
    <div>
      {loading && <p>Loading messages...</p>}
      <ul>
        {timeline.map((msg) => (
          <li key={msg._id}>{msg.content}</li>
        ))}
      </ul>
      {usersTyping.length > 0 && <p>Someone is typing...</p>}
    </div>
  )
}
```

---

## Building and Type Checking

To compile the TypeScript source files to JavaScript:

```bash
pnpm build
```

To run TypeScript verification without emitting build files:

```bash
pnpm typecheck
```

---

## License

This package is licensed under the MIT License.
