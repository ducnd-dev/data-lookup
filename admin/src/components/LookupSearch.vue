<template>
  <div class="lookup-search p-6">
    <h2 class="text-2xl font-bold mb-6">Data Lookup</h2>

    <form @submit.prevent="handleSearch" class="space-y-4 mb-6">
      <div>
        <label for="column" class="block text-sm font-medium mb-1">Column to Search</label>
        <select
          id="column"
          v-model="searchParams.colName"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="loading"
        >
          <option value="">Select a column</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="name">Name</option>
          <!-- Add more columns based on your backend AVAILABLE_LOOKUP_COLUMNS -->
        </select>
      </div>

      <div>
        <label for="values" class="block text-sm font-medium mb-1">
          Search Values (one per line)
        </label>
        <textarea
          id="values"
          v-model="valuesText"
          rows="4"
          required
          placeholder="Enter values, one per line..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="loading"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="page" class="block text-sm font-medium mb-1">Page</label>
          <input
            id="page"
            v-model.number="searchParams.page"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="loading"
          />
        </div>
        <div>
          <label for="limit" class="block text-sm font-medium mb-1">Limit</label>
          <input
            id="limit"
            v-model.number="searchParams.limit"
            type="number"
            min="1"
            max="100"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="loading"
          />
        </div>
      </div>

      <div v-if="error" class="text-red-600 text-sm">
        {{ error }}
      </div>

      <button
        type="submit"
        :disabled="loading || !searchParams.colName || !valuesText.trim()"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading">Searching...</span>
        <span v-else>Search</span>
      </button>
    </form>

    <!-- Results -->
    <div v-if="data" class="mt-6">
      <h3 class="text-lg font-semibold mb-4">
        Results ({{ data.total }} total, page {{ data.page }} of {{ data.totalPages }})
      </h3>

      <div v-if="data.data.length === 0" class="text-gray-500">
        No results found.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="result in data.data"
          :key="result.id"
          class="p-4 border border-gray-200 rounded-md bg-gray-50"
        >
          <div class="text-sm text-gray-600">ID: {{ result.id }}</div>
          <div class="mt-2">
            <div
              v-for="[key, value] in Object.entries(result)"
              :key="key"
              class="flex justify-between py-1"
            >
              <span class="font-medium">{{ key }}:</span>
              <span>{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="data.totalPages > 1" class="mt-6 flex justify-center space-x-2">
        <button
          :disabled="data.page <= 1"
          @click="changePage(data.page - 1)"
          class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span class="px-3 py-1">
          Page {{ data.page }} of {{ data.totalPages }}
        </span>
        <button
          :disabled="data.page >= data.totalPages"
          @click="changePage(data.page + 1)"
          class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi'
import { lookupApi, type LookupResult, type PaginatedResponse, type QueryLookupRequest } from '@/services'
import { computed, reactive, ref } from 'vue'

const valuesText = ref('')

const searchParams = reactive<QueryLookupRequest>({
  colName: '',
  values: [],
  page: 1,
  limit: 10,
})

const { data, loading, error, execute, reset } = useApi<PaginatedResponse<LookupResult>, [QueryLookupRequest]>(lookupApi.queryLookup)

const parsedValues = computed(() => {
  return valuesText.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
})

const handleSearch = async () => {
  if (!searchParams.colName || parsedValues.value.length === 0) {
    return
  }

  const requestData: QueryLookupRequest = {
    ...searchParams,
    values: parsedValues.value,
  }

  await execute(requestData)
}

const changePage = (page: number) => {
  searchParams.page = page
  handleSearch()
}

const resetSearch = () => {
  reset()
  valuesText.value = ''
  searchParams.colName = ''
  searchParams.values = []
  searchParams.page = 1
}
</script>
