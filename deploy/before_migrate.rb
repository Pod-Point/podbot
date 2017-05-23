current_release = release_path

# Copy config file from opsworks stack data
if node[:config]
  file "#{current_release}/config/default.json" do
    content node[:config].to_json
    mode '0440'
  end
end
