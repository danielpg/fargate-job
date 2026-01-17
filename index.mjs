
async function main() {

    console.log("Job finished successfully");

}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Job failed:", err);
    process.exit(1);
  })