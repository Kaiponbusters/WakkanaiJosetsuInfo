// defineNuxtRouteMiddleware and navigateTo are auto-imported by Nuxt

export default defineNuxtRouteMiddleware((to, from) => {
    if (to.path === '/') {
        return navigateTo('/josetsu')
    }
})