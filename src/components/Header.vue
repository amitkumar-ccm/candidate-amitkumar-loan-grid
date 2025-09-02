<script setup lang="ts">
import { capitalize } from "vue";

const props = defineProps<{
  headerTitle: string;
  fieldName: string;
  sortOrder: "ascending" | "descending" | "none";
}>();

const emit = defineEmits<{
  (e: "sort", sortField: string): void;
}>();

const handleSort = () => {
  emit("sort", props.fieldName);
};
</script>

<template>
  <th @click="handleSort" :aria-sort="props.sortOrder">
    <div class="header-class">
      {{ capitalize(props.headerTitle) }}
      <i
        :class="[
          'header-icon',
          props.sortOrder === 'ascending'
            ? 'fas fa-sort-up'
            : props.sortOrder === 'descending'
            ? 'fas fa-sort-down'
            : 'fas fa-sort',
          props.sortOrder === 'none' ? 'text-light-grey' : '',
        ]"
        aria-hidden="true"
      ></i>
    </div>
  </th>
</template>
