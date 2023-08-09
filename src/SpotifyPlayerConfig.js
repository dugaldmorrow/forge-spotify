import ForgeUI, {
  CheckboxGroup,
  Checkbox,
  MacroConfig,
  render,
  TextField,
  useConfig
} from '@forge/ui';

export const defaultConfig = {
  searchText: "Lime Cordiale",
  maxTracks: 10,
  loop: true
}

const Config = () => {
  const config = useConfig() || defaultConfig;
  console.log(`Config = `, config);
  return (
    <MacroConfig>
      {/* Form components */}
      <TextField name="searchText" label="Spotify search text" type="text" defaultValue={config.searchText} />
      <TextField name="maxTracks" label="Maximum tracks" type="number" defaultValue={config.maxTracks} />
      <CheckboxGroup name="options" label="Options" >
        <Checkbox value="loop" label="Loop" defaultChecked={!!config.loop} />
      </CheckboxGroup>
    </MacroConfig>
  );
};

export const config = render(<Config />);
