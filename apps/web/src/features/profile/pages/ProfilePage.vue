<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/ui/components/ui/tabs'
import ProfileInfoForm from '@/features/profile/components/ProfileInfoForm.vue'
import ProfilePasswordForm from '@/features/profile/components/ProfilePasswordForm.vue'
import ProfileAvatarForm from '@/features/profile/components/ProfileAvatarForm.vue'
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">Profile</h1>
      <p class="text-muted-foreground text-sm">Manage your account details and preferences.</p>
    </header>

    <Tabs default-value="profile" class="gap-6">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="avatar">Avatar</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileInfoForm />
      </TabsContent>
      <TabsContent value="password">
        <ProfilePasswordForm />
      </TabsContent>
      <TabsContent value="avatar">
        <ProfileAvatarForm />
      </TabsContent>
    </Tabs>
  </div>
</template>
