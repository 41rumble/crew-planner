<template>
  <v-file-input
    accept=".csv,.xlsx,.json"
    label="Upload"
    variant="outlined"
    density="compact"
    hide-details
    class="d-inline-block mr-2 mb-2"
    style="max-width: 150px;"
    @update:model-value="handleFileUpload"
  ></v-file-input>
</template>

<script>
export default {
  name: 'FileUploader',
  methods: {
    handleFileUpload(file) {
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const fileContent = e.target.result;
        this.$emit('file-loaded', fileContent);
      };
      
      reader.readAsText(file);
    }
  }
}
</script>